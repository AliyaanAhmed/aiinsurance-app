import { stages, type Stage } from '../../generative-ui/schemas'

export function StagePicker({ stage }: { stage: Stage }) {
  return (
    <ol className="stage-picker" aria-label="Conversation stage">
      {stages.map((item, index) => (
        <li key={item} className={item === stage ? 'active' : ''}>
          <span>{index + 1}</span>
          {item}
        </li>
      ))}
    </ol>
  )
}
