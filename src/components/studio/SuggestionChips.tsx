export function SuggestionChips({
  suggestions,
  onPick,
}: {
  suggestions: string[]
  onPick: (suggestion: string) => void
}) {
  return (
    <div className="suggestion-chips">
      {suggestions.map((suggestion) => (
        <button key={suggestion} type="button" onClick={() => onPick(suggestion)}>
          {suggestion}
        </button>
      ))}
    </div>
  )
}
