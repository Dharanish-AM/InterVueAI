import React from 'react';
import { Modal, Button, Typography, Space, Tag } from 'antd';
import { UserOutlined, ClockCircleOutlined, TrophyOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const WelcomeBackModal = ({ visible, candidate, interview, onResume, onStartNew, onCancel }) => {
  if (!candidate || !interview) return null;

  const progress = interview.currentQuestionIndex || 0;
  const totalQuestions = interview.questions?.length || 0;
  const progressPercent = totalQuestions > 0 ? Math.round((progress / totalQuestions) * 100) : 0;

  return (
    <Modal
      open={visible}
      title={null}
      footer={null}
      onCancel={onCancel}
      width={520}
      centered
      className="welcome-back-modal"
    >
      <div className="text-center p-6">
        <div className="mb-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <UserOutlined className="text-2xl text-blue-500" />
          </div>
          <Title level={3} className="mb-2">Welcome Back!</Title>
          <Text type="secondary" className="text-base">
            We found an incomplete interview session
          </Text>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-center space-x-4 mb-3">
            <Text strong className="text-lg">{candidate.name}</Text>
            <Tag color="blue">{candidate.email}</Tag>
          </div>
          
          <div className="flex items-center justify-center space-x-6 text-sm">
            <Space>
              <ClockCircleOutlined className="text-orange-500" />
              <Text type="secondary">
                Started: {new Date(interview.startedAt).toLocaleDateString()}
              </Text>
            </Space>
            
            <Space>
              <TrophyOutlined className="text-green-500" />
              <Text type="secondary">
                Progress: {progress}/{totalQuestions} questions
              </Text>
            </Space>
          </div>

          <div className="mt-3">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <Text type="secondary" className="text-xs mt-1">
              {progressPercent}% complete
            </Text>
          </div>
        </div>

        <div className="space-y-3">
          <Button 
            type="primary" 
            size="large" 
            onClick={onResume}
            className="w-full"
          >
            Continue Interview
          </Button>
          
          <Button 
            size="large" 
            onClick={onStartNew}
            className="w-full"
          >
            Start New Interview
          </Button>
          
          <Button 
            type="text" 
            size="large" 
            onClick={onCancel}
            className="w-full"
          >
            Cancel
          </Button>
        </div>

        <Text type="secondary" className="text-xs mt-4 block">
          Your progress has been automatically saved
        </Text>
      </div>
    </Modal>
  );
};

export default WelcomeBackModal;