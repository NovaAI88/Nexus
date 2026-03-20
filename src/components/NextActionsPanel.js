import SectionCard from './SectionCard';

function NextActionsPanel({ actions }) {
  return (
    <SectionCard title="Next Actions">
      <ul>{actions.map((item) => <li key={item}>{item}</li>)}</ul>
    </SectionCard>
  );
}

export default NextActionsPanel;
