import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Card, Button, Result, Space } from 'antd';
import { UserOutlined, FileTextOutlined, PlayCircleOutlined } from '@ant-design/icons';
import ResumeUploader from '../components/ResumeUploader';
import ChatWindow from '../components/ChatWindow';
import WelcomeBackModal from '../components/WelcomeBackModal';
import { startInterview, setCurrentInterview } from '../redux/interviewSlice';
import { setCurrentCandidate, clearCurrentCandidate } from '../redux/candidateSlice';
import { generateQuestions } from '../api/aiService';

const Interviewee = () => {
  const dispatch = useDispatch();
  const [currentStep, setCurrentStep] = useState('upload'); 
  const [showWelcomeBack, setShowWelcomeBack] = useState(false);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);

  const { currentCandidate } = useSelector(state => state.candidates);
  const { currentInterview, interviews } = useSelector(state => state.interviews);

  useEffect(() => {
    
    const hasIncompleteInterview = Object.values(interviews).find(
      interview => interview.status === 'in_progress'
    );

    if (hasIncompleteInterview) {
      const candidate = JSON.parse(localStorage.getItem('candidates') || '[]')
        .find(c => c.id === hasIncompleteInterview.candidateId);
      
      if (candidate) {
        setShowWelcomeBack(true);
      }
    }
  }, [interviews]);

  const handleResumeComplete = async (candidateData) => {
    setCurrentStep('interview');
    await startInterviewProcess();
  };

  const startInterviewProcess = async () => {
    if (!currentCandidate) return;

    setIsGeneratingQuestions(true);
    try {
      const questions = await generateQuestions();
      dispatch(startInterview({
        candidateId: currentCandidate.id,
        questions
      }));
    } catch (error) {
      console.error('Error starting interview:', error);
    } finally {
      setIsGeneratingQuestions(false);
    }
  };

  const handleInterviewComplete = (results) => {
    setCurrentStep('completed');
  };

  const handleWelcomeBackResume = () => {
    const incompleteInterview = Object.values(interviews).find(
      interview => interview.status === 'in_progress'
    );
    
    if (incompleteInterview) {
      dispatch(setCurrentInterview(incompleteInterview.id));
      const candidate = JSON.parse(localStorage.getItem('candidates') || '[]')
        .find(c => c.id === incompleteInterview.candidateId);
      
      if (candidate) {
        dispatch(setCurrentCandidate(candidate));
        setCurrentStep('interview');
      }
    }
    setShowWelcomeBack(false);
  };

  const handleStartNew = () => {
    dispatch(clearCurrentCandidate());
    setCurrentStep('upload');
    setShowWelcomeBack(false);
  };

  const handleStartOver = () => {
    dispatch(clearCurrentCandidate());
    setCurrentStep('upload');
  };

  const renderContent = () => {
    switch (currentStep) {
      case 'upload':
        return <ResumeUploader onComplete={handleResumeComplete} />;
      
      case 'interview':
        if (isGeneratingQuestions) {
          return (
            <div className="flex items-center justify-center h-64">
              <Card className="text-center p-8">
                <div className="mb-4">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Generating Interview Questions
                </h3>
                <p className="text-gray-600">
                  AI is preparing personalized questions based on your profile...
                </p>
              </Card>
            </div>
          );
        }
        return <ChatWindow onComplete={handleInterviewComplete} />;
      
      case 'completed':
        return (
          <Result
            status="success"
            title="Interview Completed Successfully!"
            subTitle={
              <div className="space-y-2">
                <p>Thank you for completing the interview, {currentCandidate?.name}!</p>
                <p>Your responses have been recorded and will be reviewed by our team.</p>
                {currentCandidate?.finalScore && (
                  <p className="font-medium text-lg">
                    Your Score: <span className="text-blue-600">{currentCandidate.finalScore}/10</span>
                  </p>
                )}
              </div>
            }
            extra={[
              <Button type="primary" key="new" onClick={handleStartOver}>
                Start New Interview
              </Button>,
            ]}
          />
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">

      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <UserOutlined className="text-white" />
              </div>
              <h1 className="text-xl font-semibold text-gray-900">
                AI Interview Assistant
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              {currentCandidate && (
                <Space>
                  <span className="text-sm text-gray-600">Welcome,</span>
                  <span className="font-medium">{currentCandidate.name}</span>
                </Space>
              )}
            </div>
          </div>
        </div>
      </div>


      <div className="py-6">
        {renderContent()}
      </div>


      <WelcomeBackModal
        visible={showWelcomeBack}
        candidate={currentCandidate}
        interview={currentInterview}
        onResume={handleWelcomeBackResume}
        onStartNew={handleStartNew}
        onCancel={() => setShowWelcomeBack(false)}
      />
    </div>
  );
};

export default Interviewee;