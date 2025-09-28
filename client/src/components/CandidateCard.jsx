import React from 'react';
import { Card, Tag, Space, Typography, Progress, Divider, Button, Collapse, Timeline } from 'antd';
import { UserOutlined, MailOutlined, PhoneOutlined, ClockCircleOutlined, TrophyOutlined, FileTextOutlined } from '@ant-design/icons';

const { Text, Title } = Typography;
const { Panel } = Collapse;

const CandidateCard = ({ candidate, interview, onClose }) => {
  const getScoreColor = (score) => {
    if (score >= 8) return 'green';
    if (score >= 6) return 'blue';
    if (score >= 4) return 'orange';
    return 'red';
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy': return 'green';
      case 'medium': return 'orange';
      case 'hard': return 'red';
      default: return 'blue';
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const timelineItems = interview?.questions?.map((question, index) => ({
    dot: question.answered ? <TrophyOutlined style={{ fontSize: '16px', color: getScoreColor(question.score) }} /> : <ClockCircleOutlined />,
    color: question.answered ? getScoreColor(question.score) : 'gray',
    children: (
      <div className="pb-4">
        <div className="flex items-center space-x-2 mb-2">
          <Text strong>Question {index + 1}</Text>
          <Tag color={getDifficultyColor(question.difficulty)}>
            {question.difficulty.toUpperCase()}
          </Tag>
          {question.answered && question.score && (
            <Tag color={getScoreColor(question.score)}>
              Score: {question.score}/10
            </Tag>
          )}
        </div>
        
        <Text className="block text-gray-700 mb-2">{question.question}</Text>
        
        {question.answered && (
          <Collapse ghost size="small">
            <Panel header="View Answer & Feedback" key="1">
              <div className="bg-gray-50 p-3 rounded mb-3">
                <Text strong className="block mb-1">Answer:</Text>
                <Text>{question.answer || 'No answer provided'}</Text>
                <Text type="secondary" className="block mt-2">
                  Time spent: {formatTime(question.timeSpent || 0)}
                </Text>
              </div>
              
              {question.feedback && (
                <div className="bg-blue-50 p-3 rounded">
                  <Text strong className="block mb-1">AI Feedback:</Text>
                  <Text>{question.feedback}</Text>
                </div>
              )}
            </Panel>
          </Collapse>
        )}
      </div>
    ),
  })) || [];

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <Title level={3}>Candidate Details</Title>
        {onClose && (
          <Button onClick={onClose}>Close</Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <div className="lg:col-span-1">
          <Card title={
            <Space>
              <UserOutlined className="text-blue-500" />
              Personal Information
            </Space>
          } className="shadow-sm mb-6">
            <Space direction="vertical" className="w-full">
              <div>
                <Text strong className="block">Name</Text>
                <Text className="text-lg">{candidate.name}</Text>
              </div>
              
              <div>
                <Text strong className="flex items-center mb-1">
                  <MailOutlined className="mr-2" /> Email
                </Text>
                <Text copyable>{candidate.email}</Text>
              </div>
              
              <div>
                <Text strong className="flex items-center mb-1">
                  <PhoneOutlined className="mr-2" /> Phone
                </Text>
                <Text copyable>{candidate.phone}</Text>
              </div>
              
              {candidate.experience && (
                <div>
                  <Text strong className="block">Experience</Text>
                  <Text>{candidate.experience}</Text>
                </div>
              )}
            </Space>
          </Card>


          {candidate.skills && candidate.skills.length > 0 && (
            <Card title="Skills" className="shadow-sm mb-6">
              <div className="flex flex-wrap gap-2">
                {candidate.skills.map((skill, index) => (
                  <Tag key={index} color="blue">{skill}</Tag>
                ))}
              </div>
            </Card>
          )}


          {interview?.summary && (
            <Card title={
              <Space>
                <FileTextOutlined className="text-green-500" />
                AI Summary
              </Space>
            } className="shadow-sm">
              <div className="text-center mb-4">
                {candidate.finalScore && (
                  <div>
                    <Text strong className="text-2xl" style={{ color: getScoreColor(candidate.finalScore) }}>
                      {candidate.finalScore}/10
                    </Text>
                    <Progress
                      percent={(candidate.finalScore / 10) * 100}
                      showInfo={false}
                      strokeColor={getScoreColor(candidate.finalScore)}
                      className="mt-2"
                    />
                  </div>
                )}
              </div>
              <Text>{interview.summary}</Text>
            </Card>
          )}
        </div>

        {/* Interview Progress */}
        <div className="lg:col-span-2">
          <Card title={
            <Space>
              <TrophyOutlined className="text-orange-500" />
              Interview Progress
            </Space>
          } className="shadow-sm">
            {interview?.status === 'completed' ? (
              <div className="mb-4">
                <Text type="secondary">
                  Interview completed on {new Date(interview.completedAt || interview.startedAt).toLocaleDateString()}
                </Text>
              </div>
            ) : (
              <div className="mb-4">
                <Text type="secondary">
                  Interview started on {new Date(interview?.startedAt || candidate.createdAt).toLocaleDateString()}
                </Text>
              </div>
            )}

            <Timeline items={timelineItems} mode="left" />

            {(!interview || interview.status !== 'completed') && (
              <div className="mt-6 p-4 bg-yellow-50 rounded border border-yellow-200">
                <Text type="warning">
                  <ClockCircleOutlined className="mr-2" />
                  Interview in progress or not started yet
                </Text>
              </div>
            )}
          </Card>
        </div>
      </div>


      {candidate.resumeData?.rawText && (
        <Card title="Resume Preview" className="mt-6 shadow-sm">
          <div className="bg-gray-50 p-4 rounded max-h-64 overflow-y-auto">
            <pre className="whitespace-pre-wrap text-sm font-mono">
              {candidate.resumeData.rawText}
            </pre>
          </div>
        </Card>
      )}
    </div>
  );
};

export default CandidateCard;