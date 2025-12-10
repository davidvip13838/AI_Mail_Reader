import React from 'react';

const SummarySettings = ({
    emailCount,
    setEmailCount,
    dateFilter,
    setDateFilter,
    showCustomization,
    setShowCustomization
}) => {
    return (
        <div className="customization-section">
            <div className="customization-header">
                <h3>⚙️ Summary Settings</h3>
                <button
                    className="btn btn-secondary"
                    onClick={() => setShowCustomization(!showCustomization)}
                >
                    {showCustomization ? '▼ Hide' : '▶ Show'} Options
                </button>
            </div>

            {showCustomization && (
                <div className="customization-options">
                    <div className="customization-option">
                        <label htmlFor="emailCount">
                            Number of Emails: <strong>{emailCount}</strong>
                        </label>
                        <input
                            type="range"
                            id="emailCount"
                            min="1"
                            max="50"
                            value={emailCount}
                            onChange={(e) => setEmailCount(parseInt(e.target.value))}
                            className="slider"
                        />
                        <div className="slider-labels">
                            <span>1</span>
                            <span>50</span>
                        </div>
                    </div>

                    <div className="customization-option">
                        <label htmlFor="dateFilter">Date Filter:</label>
                        <select
                            id="dateFilter"
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value)}
                            className="select-input"
                        >
                            <option value="all">All Unread Emails</option>
                            <option value="today">Today Only</option>
                            <option value="last7days">Last 7 Days</option>
                            <option value="last30days">Last 30 Days</option>
                        </select>
                    </div>

                    <div className="customization-info">
                        <p>
                            📊 You'll fetch up to <strong>{emailCount}</strong> email{emailCount !== 1 ? 's' : ''}
                            {dateFilter !== 'all' && (
                                <> from the <strong>{dateFilter === 'today' ? 'today' : dateFilter === 'last7days' ? 'last 7 days' : 'last 30 days'}</strong></>
                            )}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SummarySettings;
