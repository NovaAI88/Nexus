import SectionCard from './SectionCard';
import RecommendationCard from './RecommendationCard';

function RecommendationsPanel({
  categories,
  selectedCategory,
  onSelectCategory,
  options,
  laterOptions,
  feedbackById,
  onAdjustDuration,
  onStartNow,
  onAccept,
  onDecline,
  onPostpone,
}) {
  return (
    <SectionCard title="Recommendations">
      <div className="recommendation-groups">
        <div className="recommendation-group-block">
          <h3>Life / Schedule</h3>
          <div className="recommendation-category-list">
            {categories.life.map((category) => (
              <button
                key={category}
                className={selectedCategory === category ? 'category-button active' : 'category-button'}
                onClick={() => onSelectCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
        <div className="recommendation-group-block">
          <h3>Departments</h3>
          <div className="recommendation-category-list">
            {categories.departments.map((category) => (
              <button
                key={category}
                className={selectedCategory === category ? 'category-button active' : 'category-button'}
                onClick={() => onSelectCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="panel-group">
        <h3>{selectedCategory ? `${selectedCategory} Options` : 'Options'}</h3>
        {options.length > 0 ? (
          <div className="recommendations-list">
            {options.map((option) => (
              <RecommendationCard
                key={option.id}
                option={option}
                feedback={feedbackById[option.id]}
                onAdjustDuration={onAdjustDuration}
                onStartNow={onStartNow}
                onAccept={onAccept}
                onDecline={onDecline}
                onPostpone={onPostpone}
              />
            ))}
          </div>
        ) : (
          <p>No open options in this category.</p>
        )}
      </div>

      {laterOptions.length > 0 ? (
        <div className="panel-group">
          <h3>Later</h3>
          <div className="recommendations-list later-list">
            {laterOptions.map((option) => (
              <RecommendationCard
                key={option.id}
                option={option}
                feedback={feedbackById[option.id]}
                onAdjustDuration={onAdjustDuration}
                onStartNow={onStartNow}
                onAccept={onAccept}
                onDecline={onDecline}
                onPostpone={onPostpone}
              />
            ))}
          </div>
        </div>
      ) : null}
    </SectionCard>
  );
}

export default RecommendationsPanel;
