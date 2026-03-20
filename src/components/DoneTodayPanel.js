import SectionCard from './SectionCard';

function DoneTodayPanel({ items, onToggleTask }) {
  return (
    <SectionCard title="Done Today">
      {items.length > 0 ? (
        <ul className="task-list done-list">
          {items.map((task) => (
            <li key={task.id} className="task-item done-item">
              <label className="task-checkbox-row">
                <input
                  type="checkbox"
                  checked={task.status === 'done'}
                  onChange={() => onToggleTask(task.id)}
                />
                <span>{task.title}</span>
              </label>
            </li>
          ))}
        </ul>
      ) : (
        <p>Nothing completed yet.</p>
      )}
    </SectionCard>
  );
}

export default DoneTodayPanel;
