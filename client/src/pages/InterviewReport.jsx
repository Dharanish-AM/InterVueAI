import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchInterview } from '../redux/slices/interviewSlice';
import { ArrowLeft, CheckCircle, AlertCircle, Award, BookOpen, Code, Brain } from 'lucide-react';

const InterviewReport = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { currentInterview, isLoading, isError, message } = useSelector((state) => state.interview);

  useEffect(() => {
    dispatch(fetchInterview(id));
  }, [dispatch, id]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="max-w-4xl mx-auto mt-10 p-6 bg-red-50 rounded-xl text-red-700 flex items-center gap-3">
        <AlertCircle className="w-6 h-6" />
        <p>{message || "Failed to load interview report."}</p>
      </div>
    );
  }

  if (!currentInterview) return null;

  const getRoundIcon = (type) => {
    switch (type) {
      case 'aptitude': return <Brain className="w-5 h-5" />;
      case 'technical': return <BookOpen className="w-5 h-5" />;
      case 'coding': return <Code className="w-5 h-5" />;
      default: return <CheckCircle className="w-5 h-5" />;
    }
  };

  return (
    <div className="max-w-5xl mx-auto pb-12">
      <Link to="/dashboard" className="inline-flex items-center text-slate-500 hover:text-primary-600 mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Dashboard
      </Link>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-8">
        <div className="bg-slate-900 p-8 text-white">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold mb-2">Interview Report</h1>
              <p className="text-slate-400">Session ID: {currentInterview._id}</p>
              <p className="text-slate-400 text-sm mt-1">
                {new Date(currentInterview.createdAt).toLocaleDateString()} • {new Date(currentInterview.createdAt).toLocaleTimeString()}
              </p>
            </div>
            <div className="text-center bg-white/10 p-4 rounded-xl backdrop-blur-sm">
              <p className="text-sm text-slate-300 mb-1">Total Score</p>
              <div className="text-4xl font-bold text-primary-400">{currentInterview.totalScore}/100</div>
            </div>
          </div>
        </div>

        <div className="p-8">
          <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Award className="w-6 h-6 text-primary-600" />
            Overall Feedback
          </h2>
          <p className="text-slate-600 leading-relaxed bg-slate-50 p-6 rounded-xl border border-slate-100">
            {currentInterview.overallFeedback}
          </p>
        </div>
      </div>

      <h2 className="text-2xl font-bold text-slate-900 mb-6">Round Analysis</h2>
      <div className="space-y-6">
        {currentInterview.rounds.map((round, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white text-primary-600 rounded-lg shadow-sm flex items-center justify-center border border-slate-100">
                  {getRoundIcon(round.roundType)}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 capitalize">{round.roundType} Round</h3>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    round.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {round.status}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-500">Score</p>
                <p className="text-xl font-bold text-slate-900">{round.score}%</p>
              </div>
            </div>
            
            <div className="p-6">
              <div className="mb-6">
                <h4 className="font-semibold text-slate-900 mb-2">Feedback</h4>
                <p className="text-slate-600 text-sm">{round.feedback}</p>
              </div>

              {round.questions && round.questions.length > 0 && (
                <div>
                  <h4 className="font-semibold text-slate-900 mb-4">Questions & Answers</h4>
                  <div className="space-y-4">
                    {round.questions.map((q, idx) => (
                      <div key={idx} className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                        <p className="font-medium text-slate-900 mb-2">Q: {q}</p>
                        <p className="text-slate-600 text-sm pl-4 border-l-2 border-primary-200">
                          A: {round.answers[idx] || "No answer recorded"}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default InterviewReport;
