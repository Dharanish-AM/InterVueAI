import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

const Home = () => {
  return (
    <div className="max-w-5xl mx-auto pt-12 pb-24">
      <div className="text-center space-y-6 mb-16">
        <h1 className="text-5xl md:text-6xl font-bold text-slate-900 tracking-tight">
          Master Your Interview <br />
          <span className="text-primary-600">With AI Precision</span>
        </h1>
        <p className="text-xl text-slate-600 max-w-2xl mx-auto">
          Upload your resume, get tailored questions, and practice with our advanced AI interviewer to land your dream job.
        </p>
        <div className="flex items-center justify-center gap-4 pt-4">
          <Link to="/register" className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-3 rounded-xl font-semibold text-lg flex items-center gap-2 transition-all shadow-lg shadow-primary-200">
            Start Practicing <ArrowRight className="w-5 h-5" />
          </Link>
          <Link to="/login" className="bg-white border border-slate-200 hover:border-primary-200 text-slate-700 hover:text-primary-700 px-8 py-3 rounded-xl font-semibold text-lg transition-all">
            Log In
          </Link>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8 px-4">
        {[
          {
            title: "Resume Analysis",
            desc: "Our AI scans your resume to identify key strengths and generate relevant questions."
          },
          {
            title: "Real-time Feedback",
            desc: "Get instant feedback on your answers, tone, and pacing during the interview."
          },
          {
            title: "Mock Interviews",
            desc: "Practice with realistic scenarios tailored to your specific job role and industry."
          }
        ].map((feature, idx) => (
          <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-primary-50 rounded-full flex items-center justify-center text-primary-600 mb-4">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">{feature.title}</h3>
            <p className="text-slate-600">{feature.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Home;
