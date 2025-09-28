import React, { useState, useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Card, Button, Input, Space, Typography, Avatar, Spin, Progress } from 'antd';
import { SendOutlined, UserOutlined, RobotOutlined } from '@ant-design/icons';
import { submitAnswer, scoreAnswer, nextQuestion, completeInterview, startTimer, stopTimer, setTimer } from '../redux/interviewSlice';
import { updateCandidate } from '../redux/candidateSlice';
import { scoreAnswer as scoreAnswerAPI, generateSummary } from '../api/aiService';
import Timer from './Timer';

const { TextArea } = Input;
const { Title, Text } = Typography;

const ChatWindow = ({ onComplete }) => {
  const dispatch = useDispatch();
  const messagesEndRef = useRef(null);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [messages, setMessages] = useState([]);
  
  const { 
    currentInterview, 
    questions, 
    currentQuestionIndex, 
    timeRemaining,
    isTimerActive 
  } = useSelector(state => state.interviews);
  
  const { currentCandidate } = useSelector(state => state.candidates);

  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const progress = ((currentQuestionIndex) / questions.length) * 100;

  useEffect(() => {
    if (currentQuestion) {
      
      setMessages(prev => {
        const questionExists = prev.some(msg => 
          msg.type === 'question' && msg.questionIndex === currentQuestionIndex
        );
        
        if (!questionExists) {
          return [...prev, {
            id: Date.now(),
            type: 'question',
            content: currentQuestion.question,
            questionIndex: currentQuestionIndex,
            difficulty: currentQuestion.difficulty,
            timestamp: new Date().toISOString(),
          }];
        }
        return prev;
      });

      
      dispatch(setTimer(currentQuestion.timeLimit));
      dispatch(startTimer());
    }
  }, [currentQuestion, currentQuestionIndex, dispatch]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleTimeUp = async () => {
    if (currentAnswer.trim()) {
      await handleSubmitAnswer();
    } else {
      
      await handleSubmitAnswer(true);
    }
  };

  const handleSubmitAnswer = async (isAutoSubmit = false) => {
    if (!currentQuestion || isSubmitting) return;

    const answer = isAutoSubmit ? 'No answer provided (time expired)' : currentAnswer.trim();
    const timeSpent = currentQuestion.timeLimit - timeRemaining;

    setIsSubmitting(true);
    dispatch(stopTimer());

    try {
      
      const answerMessage = {
        id: Date.now(),
        type: 'answer',
        content: answer,
        questionIndex: currentQuestionIndex,
        timeSpent,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, answerMessage]);

      
      dispatch(submitAnswer({ answer, timeSpent }));

      
      const scoringResult = await scoreAnswerAPI(
        currentQuestion.question, 
        answer, 
        currentQuestion.difficulty
      );

      
      dispatch(scoreAnswer({
        questionIndex: currentQuestionIndex,
        score: scoringResult.score,
        feedback: scoringResult.feedback,
      }));

      
      const feedbackMessage = {
        id: Date.now() + 1,
        type: 'feedback',
        content: scoringResult.feedback,
        score: scoringResult.score,
        questionIndex: currentQuestionIndex,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, feedbackMessage]);

      
      if (isLastQuestion) {
        await completeInterviewProcess();
      } else {
        setTimeout(() => {
          dispatch(nextQuestion());
          setCurrentAnswer('');
        }, 2000);
      }

    } catch (error) {
      console.error('Error submitting answer:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const completeInterviewProcess = async () => {
    try {
      
      const answeredQuestions = questions.filter(q => q.answered);
      const totalScore = answeredQuestions.reduce((sum, q) => sum + (q.score || 0), 0);
      const finalScore = answeredQuestions.length > 0 ? 
        Math.round((totalScore / answeredQuestions.length) * 10) / 10 : 0;

      
      const summary = await generateSummary(currentCandidate, answeredQuestions);

      
      dispatch(completeInterview({ finalScore, summary }));

      
      dispatch(updateCandidate({
        id: currentCandidate.id,
        finalScore,
        summary,
        interviewCompletedAt: new Date().toISOString(),
        status: 'completed'
      }));

      
      const completionMessage = {
        id: Date.now() + 2,
        type: 'completion',
        content: `Interview completed! Your final score is ${finalScore}/10.`,
        summary,
        finalScore,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, completionMessage]);

      
      if (onComplete) {
        setTimeout(() => {
          onComplete({ finalScore, summary });
        }, 3000);
      }

    } catch (error) {
      console.error('Error completing interview:', error);
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy': return 'green';
      case 'medium': return 'orange';
      case 'hard': return 'red';
      default: return 'blue';
    }
  };

  const renderMessage = (message) => {
    switch (message.type) {
      case 'question':
        return (
          <div key={message.id} className="flex items-start space-x-3 mb-6">
            <Avatar icon={<RobotOutlined />} className="bg-blue-500 flex-shrink-0" />
            <div className="bg-blue-50 rounded-lg p-4 max-w-3xl">
              <div className="flex items-center space-x-2 mb-2">
                <Text strong className="text-blue-800">
                  Question {message.questionIndex + 1}
                </Text>
                <span className={`px-2 py-1 rounded text-xs text-white bg-${getDifficultyColor(message.difficulty)}-500`}>
                  {message.difficulty.toUpperCase()}
                </span>
              </div>
              <Text className="text-gray-800">{message.content}</Text>
            </div>
          </div>
        );

      case 'answer':
        return (
          <div key={message.id} className="flex items-start space-x-3 mb-6 justify-end">
            <div className="bg-gray-100 rounded-lg p-4 max-w-3xl">
              <div className="flex items-center space-x-2 mb-2">
                <Text strong className="text-gray-700">Your Answer</Text>
                <Text type="secondary" className="text-xs">
                  Time spent: {Math.floor(message.timeSpent / 60)}:{(message.timeSpent % 60).toString().padStart(2, '0')}
                </Text>
              </div>
              <Text className="text-gray-800">{message.content}</Text>
            </div>
            <Avatar icon={<UserOutlined />} className="bg-gray-500 flex-shrink-0" />
          </div>
        );

      case 'feedback':
        return (
          <div key={message.id} className="flex items-start space-x-3 mb-6">
            <Avatar icon={<RobotOutlined />} className="bg-green-500 flex-shrink-0" />
            <div className="bg-green-50 rounded-lg p-4 max-w-3xl">
              <div className="flex items-center space-x-2 mb-2">
                <Text strong className="text-green-800">AI Feedback</Text>
                <span className="px-2 py-1 rounded text-xs text-white bg-green-600">
                  Score: {message.score}/10
                </span>
              </div>
              <Text className="text-gray-800">{message.content}</Text>
            </div>
          </div>
        );

      case 'completion':
        return (
          <div key={message.id} className="flex items-start space-x-3 mb-6">
            <Avatar icon={<RobotOutlined />} className="bg-purple-500 flex-shrink-0" />
            <div className="bg-purple-50 rounded-lg p-4 max-w-3xl border border-purple-200">
              <div className="flex items-center space-x-2 mb-2">
                <Text strong className="text-purple-800">Interview Complete</Text>
                <span className="px-2 py-1 rounded text-xs text-white bg-purple-600">
                  Final Score: {message.finalScore}/10
                </span>
              </div>
              <Text className="text-gray-800 block mb-3">{message.content}</Text>
              <div className="mt-3 p-3 bg-white rounded border">
                <Text strong className="block mb-2">Summary:</Text>
                <Text className="text-gray-700">{message.summary}</Text>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (!currentInterview || !currentQuestion) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spin size="large" />
      </div>
    );
  }

  const isAnswered = questions[currentQuestionIndex]?.answered;
  const isCompleted = currentInterview.status === 'completed';

  return (
    <div className="max-w-5xl mx-auto p-6">
      {/* Progress Header */}
      <Card className="mb-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <Title level={4} className="m-0">
            Interview with {currentCandidate?.name}
          </Title>
          <Text type="secondary">
            Question {currentQuestionIndex + 1} of {questions.length}
          </Text>
        </div>
        <Progress 
          percent={progress} 
          showInfo={false}
          strokeColor="#1890ff"
          className="mb-4"
        />
        
        {!isCompleted && !isAnswered && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <Timer 
                onTimeUp={handleTimeUp}
                totalTime={currentQuestion?.timeLimit || 60}
              />
            </div>
          </div>
        )}
      </Card>

      {/* Chat Messages */}
      <Card className="mb-6 shadow-sm" bodyStyle={{ padding: '24px', minHeight: '400px', maxHeight: '600px', overflowY: 'auto' }}>
        <div className="space-y-4">
          {messages.map(renderMessage)}
          <div ref={messagesEndRef} />
        </div>
      </Card>

      {/* Answer Input */}
      {!isCompleted && !isAnswered && (
        <Card className="shadow-sm">
          <div className="space-y-4">
            <TextArea
              value={currentAnswer}
              onChange={(e) => setCurrentAnswer(e.target.value)}
              placeholder="Type your answer here..."
              rows={4}
              className="resize-none"
              disabled={isSubmitting}
            />
            
            <div className="flex justify-between items-center">
              <Text type="secondary">
                Time remaining: {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
              </Text>
              
              <Space>
                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  onClick={() => handleSubmitAnswer()}
                  disabled={!currentAnswer.trim() || isSubmitting}
                  loading={isSubmitting}
                  size="large"
                >
                  Submit Answer
                </Button>
              </Space>
            </div>
          </div>
        </Card>
      )}

      {/* Waiting for next question */}
      {isAnswered && !isCompleted && !isLastQuestion && (
        <Card className="shadow-sm text-center">
          <div className="py-8">
            <Spin size="large" />
            <Text className="block mt-4 text-gray-600">
              Preparing next question...
            </Text>
          </div>
        </Card>
      )}
    </div>
  );
};

export default ChatWindow;