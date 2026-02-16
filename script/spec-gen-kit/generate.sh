#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEMPLATES_DIR="$SCRIPT_DIR/templates"
OUTPUT_DIR="$SCRIPT_DIR/output"

# --- Default project root (override with SPEC_PROJECT_ROOT env var) ---
PROJECT_ROOT="${SPEC_PROJECT_ROOT:-}"

# --- Usage ---
usage() {
  echo "Usage: $0 <extract|spec-gen|spec-gen-manual|spec-gen-only|implement>"
  echo ""
  echo "  extract          — Extract requirements from a conversation history"
  echo "  spec-gen         — Generate spec from rich extracted requirements + code (two-phase)"
  echo "  spec-gen-manual  — Generate spec with module picker + freeform requirement (one-phase)"
  echo "  spec-gen-only    — Generate a single holistic spec to reproduce an entire prototype"
  echo "  implement        — Generate implementation prompt from WORKING_DIR"
  echo ""
  echo "Flows:"
  echo "  Two-phase:    extract → (human approves) → spec-gen → implement"
  echo "  One-phase:    spec-gen-manual → implement"
  echo "  Whole-proto:  spec-gen-only → implement"
  echo ""
  echo "Environment:"
  echo "  SPEC_PROJECT_ROOT  — Base directory for module picker (used by spec-gen-manual)"
  echo "                       e.g. export SPEC_PROJECT_ROOT=staging/web/src/app"
  exit 1
}

# --- Clipboard helper ---
copy_to_clipboard() {
  if command -v pbcopy &>/dev/null; then
    pbcopy < "$1"
  elif command -v xclip &>/dev/null; then
    xclip -selection clipboard < "$1"
  elif command -v xsel &>/dev/null; then
    xsel --clipboard --input < "$1"
  elif command -v wl-copy &>/dev/null; then
    wl-copy < "$1"
  else
    echo "⚠️  No clipboard tool found (pbcopy/xclip/xsel/wl-copy). Skipping clipboard copy."
    return 1
  fi
}

# --- Module picker ---
pick_module() {
  local base_dir="$1"

  if [[ ! -d "$base_dir" ]]; then
    echo "❌ Directory not found: $base_dir" >&2
    echo "   Set SPEC_PROJECT_ROOT or pass a valid path." >&2
    exit 1
  fi

  local -a modules=()
  while IFS= read -r dir; do
    modules+=("$(basename "$dir")")
  done < <(find "$base_dir" -mindepth 1 -maxdepth 1 -type d | sort)

  if [[ ${#modules[@]} -eq 0 ]]; then
    echo "❌ No subdirectories found in: $base_dir" >&2
    exit 1
  fi

  echo "Available modules ($base_dir/):"
  for i in "${!modules[@]}"; do
    printf "  %d) %s\n" "$((i + 1))" "${modules[$i]}"
  done

  local choice
  read -rp "Select module [1-${#modules[@]}]: " choice

  if [[ ! "$choice" =~ ^[0-9]+$ ]] || (( choice < 1 || choice > ${#modules[@]} )); then
    echo "❌ Invalid selection" >&2
    exit 1
  fi

  local selected="${modules[$((choice - 1))]}"
  PICKED_MODULE="$base_dir/$selected/"
  echo "→ $PICKED_MODULE"
}

# --- Validate arg ---
if [[ $# -ne 1 ]]; then
  usage
fi

MODE="$1"

mkdir -p "$OUTPUT_DIR"

case "$MODE" in

  extract)
    TEMPLATE="$TEMPLATES_DIR/extract-requirements.md"
    if [[ ! -f "$TEMPLATE" ]]; then
      echo "❌ Template not found: $TEMPLATE"
      exit 1
    fi

    echo "🔍 Extract Requirements from Conversation"
    echo "=========================================="
    echo ""
    echo "Provide the conversation history:"
    echo "  1. Enter a file path (.md, .txt, .json)"
    echo "  2. Type 'paste' to paste directly"
    echo ""
    read -rp "File path or 'paste': " CONVO_INPUT

    if [[ "$CONVO_INPUT" == "paste" ]]; then
      echo ""
      echo "Paste the conversation below. Press Ctrl+D when done:"
      echo "---"
      CONVERSATION="$(cat)"
    elif [[ -f "$CONVO_INPUT" ]]; then
      CONVERSATION="$(cat "$CONVO_INPUT")"
    else
      echo "❌ File not found: $CONVO_INPUT"
      exit 1
    fi

    OUTPUT="$OUTPUT_DIR/extract-requirements-prompt.md"

    awk -v convo="$CONVERSATION" '{gsub(/\{\{CONVERSATION_HISTORY\}\}/, convo); print}' "$TEMPLATE" > "$OUTPUT"

    echo ""
    echo "✅ Prompt written to: $OUTPUT"
    echo ""
    echo "📌 Next step: Feed this to an AI. The output → APPROVED_REQUIREMENT for spec-gen."

    if copy_to_clipboard "$OUTPUT"; then
      echo "📎 Copied to clipboard!"
    fi
    ;;

  spec-gen)
    TEMPLATE="$TEMPLATES_DIR/spec-gen.md"
    if [[ ! -f "$TEMPLATE" ]]; then
      echo "❌ Template not found: $TEMPLATE"
      exit 1
    fi

    echo "📋 Spec Generation Prompt (two-phase)"
    echo "======================================"
    echo ""
    read -rp "Working directory (e.g. src/app/modules/hello-world/): " WORKING_DIR
    echo ""
    echo "Approved requirement — enter a file path to the extracted requirements, or type directly:"
    read -rp "> " REQ_INPUT

    if [[ -f "$REQ_INPUT" ]]; then
      APPROVED_REQUIREMENT="$(cat "$REQ_INPUT")"
    else
      APPROVED_REQUIREMENT="$REQ_INPUT"
    fi

    OUTPUT="$OUTPUT_DIR/spec-gen-prompt.md"

    sed "s|{{WORKING_DIR}}|${WORKING_DIR}|g" "$TEMPLATE" > "$OUTPUT.tmp"
    awk -v req="$APPROVED_REQUIREMENT" '{gsub(/\{\{APPROVED_REQUIREMENT\}\}/, req); print}' "$OUTPUT.tmp" > "$OUTPUT"
    rm -f "$OUTPUT.tmp"

    echo ""
    echo "✅ Prompt written to: $OUTPUT"

    if copy_to_clipboard "$OUTPUT"; then
      echo "📎 Copied to clipboard!"
    fi
    ;;

  spec-gen-manual)
    TEMPLATE="$TEMPLATES_DIR/spec-gen-manual.md"
    if [[ ! -f "$TEMPLATE" ]]; then
      echo "❌ Template not found: $TEMPLATE"
      exit 1
    fi

    echo "📋 Spec Generation Prompt (manual)"
    echo "==================================="
    echo ""

    # Module picker or manual path
    if [[ -n "$PROJECT_ROOT" ]]; then
      pick_module "$PROJECT_ROOT"
      WORKING_DIR="$PICKED_MODULE"
    else
      echo "(Tip: set SPEC_PROJECT_ROOT for module picker)"
      read -rp "Working directory: " WORKING_DIR
    fi

    echo ""
    read -rp "Approved requirement (what the human approved): " APPROVED_REQUIREMENT

    OUTPUT="$OUTPUT_DIR/spec-gen-manual-prompt.md"

    sed "s|{{WORKING_DIR}}|${WORKING_DIR}|g" "$TEMPLATE" > "$OUTPUT.tmp"
    awk -v req="$APPROVED_REQUIREMENT" '{gsub(/\{\{APPROVED_REQUIREMENT\}\}/, req); print}' "$OUTPUT.tmp" > "$OUTPUT"
    rm -f "$OUTPUT.tmp"

    echo ""
    echo "✅ Prompt written to: $OUTPUT"

    if copy_to_clipboard "$OUTPUT"; then
      echo "📎 Copied to clipboard!"
    fi
    ;;

  spec-gen-only)
    TEMPLATE="$TEMPLATES_DIR/spec-gen-only.md"
    if [[ ! -f "$TEMPLATE" ]]; then
      echo "❌ Template not found: $TEMPLATE"
      exit 1
    fi

    echo "🔬 Whole-Prototype Spec Generation"
    echo "==================================="
    echo ""
    read -rp "Working directory (e.g. src/app/modules/git-as-state/): " WORKING_DIR
    echo ""

    # Conversation history
    echo "Conversation history — enter a file path, or type 'paste':"
    read -rp "> " CONVO_INPUT

    if [[ "$CONVO_INPUT" == "paste" ]]; then
      echo ""
      echo "Paste the conversation below. Press Ctrl+D when done:"
      echo "---"
      CONVERSATION="$(cat)"
    elif [[ -f "$CONVO_INPUT" ]]; then
      CONVERSATION="$(cat "$CONVO_INPUT")"
    else
      echo "❌ File not found: $CONVO_INPUT"
      exit 1
    fi

    echo ""
    read -rp "Guide hint (the essence of this prototype in your words): " GUIDE_HINT

    OUTPUT="$OUTPUT_DIR/spec-gen-only-prompt.md"

    # Replace WORKING_DIR first
    sed "s|{{WORKING_DIR}}|${WORKING_DIR}|g" "$TEMPLATE" > "$OUTPUT.tmp1"

    # Replace CONVERSATION_HISTORY
    awk -v convo="$CONVERSATION" '{gsub(/\{\{CONVERSATION_HISTORY\}\}/, convo); print}' "$OUTPUT.tmp1" > "$OUTPUT.tmp2"

    # Replace GUIDE_HINT
    awk -v hint="$GUIDE_HINT" '{gsub(/\{\{GUIDE_HINT\}\}/, hint); print}' "$OUTPUT.tmp2" > "$OUTPUT"

    rm -f "$OUTPUT.tmp1" "$OUTPUT.tmp2"

    echo ""
    echo "✅ Prompt written to: $OUTPUT"

    if copy_to_clipboard "$OUTPUT"; then
      echo "📎 Copied to clipboard!"
    fi
    ;;

  implement)
    TEMPLATE="$TEMPLATES_DIR/implement.md"
    if [[ ! -f "$TEMPLATE" ]]; then
      echo "❌ Template not found: $TEMPLATE"
      exit 1
    fi

    echo "🔨 Implementation Prompt"
    echo "========================"
    echo ""
    read -rp "Working directory (e.g. src/app/modules/forwards/): " WORKING_DIR

    OUTPUT="$OUTPUT_DIR/implement-prompt.md"

    sed "s|{{WORKING_DIR}}|${WORKING_DIR}|g" "$TEMPLATE" > "$OUTPUT"

    echo ""
    echo "✅ Prompt written to: $OUTPUT"

    if copy_to_clipboard "$OUTPUT"; then
      echo "📎 Copied to clipboard!"
    fi
    ;;

  *)
    usage
    ;;

esac
