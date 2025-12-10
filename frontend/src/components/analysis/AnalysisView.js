import React from 'react';

const AnalysisView = ({
    userAnalysis,
    showAnalysis,
    setShowAnalysis,
    deleteAnalysis
}) => {
    if (!userAnalysis && !showAnalysis) return null;

    return (
        <div className="analysis-section">
            <div className="section-header">
                <h3>👤 Your Profile Analysis</h3>
                <div className="header-actions">
                    <button
                        className="btn btn-secondary"
                        onClick={() => setShowAnalysis(!showAnalysis)}
                    >
                        {showAnalysis ? '▼ Hide' : '▶ Show'} Analysis
                    </button>
                    <button
                        className="btn-delete"
                        onClick={deleteAnalysis}
                        title="Delete analysis"
                    >
                        🗑️
                    </button>
                </div>
            </div>

            {showAnalysis && userAnalysis && (
                <div className="analysis-content">
                    {userAnalysis.insights && (
                        <div className="analysis-insights">
                            <h4>💡 Key Insights</h4>
                            <p>{userAnalysis.insights}</p>
                        </div>
                    )}

                    <div className="analysis-grid">
                        {(userAnalysis.interests && userAnalysis.interests.length > 0) && (
                            <div className="analysis-card">
                                <h4>🎯 Interests</h4>
                                <div className="tag-list">
                                    {userAnalysis.interests.map((interest, idx) => (
                                        <span key={idx} className="tag">{interest}</span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {(userAnalysis.hobbies && userAnalysis.hobbies.length > 0) && (
                            <div className="analysis-card">
                                <h4>🎨 Hobbies</h4>
                                <div className="tag-list">
                                    {userAnalysis.hobbies.map((hobby, idx) => (
                                        <span key={idx} className="tag">{hobby}</span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {userAnalysis.school && (
                            <div className="analysis-card">
                                <h4>🏫 School</h4>
                                <p>{userAnalysis.school}</p>
                            </div>
                        )}

                        {userAnalysis.university && (
                            <div className="analysis-card">
                                <h4>🎓 University</h4>
                                <p>{userAnalysis.university}</p>
                            </div>
                        )}

                        {userAnalysis.company && (
                            <div className="analysis-card">
                                <h4>💼 Company</h4>
                                <p>{userAnalysis.company}</p>
                                {userAnalysis.jobTitle && (
                                    <p className="sub-text">{userAnalysis.jobTitle}</p>
                                )}
                            </div>
                        )}

                        {userAnalysis.location && (userAnalysis.location.city || userAnalysis.location.country) && (
                            <div className="analysis-card">
                                <h4>📍 Location</h4>
                                <p>
                                    {[userAnalysis.location.city, userAnalysis.location.state, userAnalysis.location.country]
                                        .filter(Boolean)
                                        .join(', ')}
                                </p>
                            </div>
                        )}

                        {userAnalysis.communicationStyle && (
                            <div className="analysis-card">
                                <h4>💬 Communication Style</h4>
                                <p>{userAnalysis.communicationStyle}</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AnalysisView;
