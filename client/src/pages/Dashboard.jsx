import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { BarChart, Clock, FileText, Star, CheckCircle } from 'lucide-react';

const Dashboard = () => {
  const { user } = useSelector((state) => state.auth);

  const stats = [
    { label: 'Interviews Completed', value: '12', icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100' },
    { label: 'Average Score', value: '85%', icon: Star, color: 'text-yellow-600', bg: 'bg-yellow-100' },
    { label: 'Practice Hours', value: '24h', icon: Clock, color: 'text-blue-600', bg: 'bg-blue-100' },
    { label: 'Resumes Analyzed', value: '3', icon: FileText, color: 'text-purple-600', bg: 'bg-purple-100' },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-600 mt-2">Welcome back, {user?.name || 'User'}! Here's your progress.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${stat.bg} ${stat.color}`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">{stat.label}</p>
              <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Recent Activity</h2>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Link key={i} to={`/interview/session-${i}/report`} className="flex items-center gap-4 p-4 hover:bg-slate-50 rounded-lg transition-colors border border-slate-100 block">
                <div className="w-10 h-10 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center font-bold">
                  AI
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900">Mock Interview #{i}</h3>
                  <p className="text-sm text-slate-500">Frontend Developer Role • 2 days ago</p>
                </div>
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                  Completed
                </span>
              </Link>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Recommended</h2>
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
              <h3 className="font-semibold text-slate-900 mb-1">System Design</h3>
              <p className="text-sm text-slate-600 mb-3">Practice scalable architecture questions.</p>
              <button className="text-primary-600 text-sm font-medium hover:underline">Start Practice →</button>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
              <h3 className="font-semibold text-slate-900 mb-1">Behavioral</h3>
              <p className="text-sm text-slate-600 mb-3">Master the STAR method.</p>
              <button className="text-primary-600 text-sm font-medium hover:underline">Start Practice →</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
