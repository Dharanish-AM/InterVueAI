import React, { useState, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Table, Card, Button, Input, Select, Space, Tag, Typography, Empty, Statistic, Row, Col, Modal } from 'antd';
import { UserOutlined, SearchOutlined, EyeOutlined, TrophyOutlined, CalendarOutlined, TeamOutlined, DeleteOutlined } from '@ant-design/icons';
import CandidateCard from '../components/CandidateCard';
import { removeCandidate } from '../redux/candidateSlice'; 

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;

const Interviewer = () => {
  const dispatch = useDispatch();
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [filterStatus, setFilterStatus] = useState('all');

  const { candidates } = useSelector(state => state.candidates);
  const { interviews } = useSelector(state => state.interviews);

  const candidatesWithInterviews = useMemo(() => {
    return candidates.map(candidate => {
      const candidateInterview = Object.values(interviews).find(
        interview => interview.candidateId === candidate.id
      );
      
      return {
        ...candidate,
        interview: candidateInterview,
        interviewStatus: candidateInterview?.status || 'not_started',
        score: candidate.finalScore || candidateInterview?.finalScore || 0,
        completedAt: candidateInterview?.completedAt || null,
      };
    });
  }, [candidates, interviews]);

  const filteredCandidates = useMemo(() => {
    let filtered = candidatesWithInterviews;

    if (searchTerm) {
      filtered = filtered.filter(candidate =>
        candidate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        candidate.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(candidate => candidate.interviewStatus === filterStatus);
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'score':
          return b.score - a.score;
        case 'name':
          return a.name.localeCompare(b.name);
        case 'createdAt':
          return new Date(b.createdAt) - new Date(a.createdAt);
        default:
          return 0;
      }
    });

    return filtered;
  }, [candidatesWithInterviews, searchTerm, sortBy, filterStatus]);

  const statistics = useMemo(() => {
    const total = candidatesWithInterviews.length;
    const completed = candidatesWithInterviews.filter(c => c.interviewStatus === 'completed').length;
    const inProgress = candidatesWithInterviews.filter(c => c.interviewStatus === 'in_progress').length;
    const averageScore = completed > 0 ? 
      candidatesWithInterviews
        .filter(c => c.score > 0)
        .reduce((sum, c) => sum + c.score, 0) / completed : 0;

    return { total, completed, inProgress, averageScore };
  }, [candidatesWithInterviews]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'green';
      case 'in_progress': return 'orange';
      case 'not_started': return 'gray';
      default: return 'gray';
    }
  };

  const getScoreColor = (score) => {
    if (score >= 8) return 'green';
    if (score >= 6) return 'blue';
    if (score >= 4) return 'orange';
    return 'red';
  };

  const handleDelete = (candidate) => {
    Modal.confirm({
      title: `Delete candidate ${candidate.name}?`,
      content: "This action cannot be undone.",
      okText: "Delete",
      okType: "danger",
      cancelText: "Cancel",
      onOk() {
        dispatch(removeCandidate(candidate.id)); // update Redux state
      }
    });
  };

  const columns = [
    {
      title: 'Candidate',
      key: 'candidate',
      render: (_, record) => (
        <div>
          <div className="font-medium">{record.name}</div>
          <div className="text-sm text-gray-500">{record.email}</div>
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'interviewStatus',
      key: 'status',
      render: (status) => (
        <Tag color={getStatusColor(status)}>
          {status.replace('_', ' ').toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Score',
      dataIndex: 'score',
      key: 'score',
      sorter: (a, b) => a.score - b.score,
      render: (score) => (
        <div>
          {score > 0 ? (
            <Tag color={getScoreColor(score)} className="font-mono">
              {score}/10
            </Tag>
          ) : (
            <Text type="secondary">-</Text>
          )}
        </div>
      ),
    },
    {
      title: 'Applied',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => {
        if (!date) return '-';
        return new Date(date).toLocaleString('en-US', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        });
      },
    },
    {
      title: 'Completed',
      dataIndex: 'completedAt',
      key: 'completedAt',
      render: (date) => {
        if (!date) return '-';
        return new Date(date).toLocaleString('en-US', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        });
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            icon={<EyeOutlined />}
            onClick={() => setSelectedCandidate(record)}
          >
            View Details
          </Button>
          <Button
            type="default"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record)}
          >
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  if (selectedCandidate) {
    return (
      <CandidateCard
        candidate={selectedCandidate}
        interview={selectedCandidate.interview}
        onClose={() => setSelectedCandidate(null)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <TeamOutlined className="text-white" />
              </div>
              <h1 className="text-xl font-semibold text-gray-900">
                Interviewer Dashboard
              </h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Statistics */}
        <Row gutter={16} className="mb-6">
          <Col span={6}>
            <Card>
              <Statistic
                title="Total Candidates"
                value={statistics.total}
                prefix={<UserOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Completed"
                value={statistics.completed}
                prefix={<TrophyOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="In Progress"
                value={statistics.inProgress}
                prefix={<CalendarOutlined />}
                valueStyle={{ color: '#fa8c16' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Average Score"
                value={statistics.averageScore.toFixed(1)}
                prefix={<TrophyOutlined />}
                suffix="/10"
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
        </Row>

        {/* Filters and Search */}
        <Card className="mb-6 shadow-sm">
          <div className="flex items-center justify-between">
            <Title level={4} className="m-0">Candidates</Title>
            <Space>
              <Search
                placeholder="Search candidates..."
                allowClear
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ width: 250 }}
              />
              
              <Select
                value={filterStatus}
                onChange={setFilterStatus}
                style={{ width: 150 }}
              >
                <Option value="all">All Status</Option>
                <Option value="completed">Completed</Option>
                <Option value="in_progress">In Progress</Option>
                <Option value="not_started">Not Started</Option>
              </Select>
              
              <Select
                value={sortBy}
                onChange={setSortBy}
                style={{ width: 150 }}
              >
                <Option value="createdAt">Latest</Option>
                <Option value="score">Score</Option>
                <Option value="name">Name</Option>
              </Select>
            </Space>
          </div>
        </Card>


        <Card className="shadow-sm">
          {filteredCandidates.length > 0 ? (
            <Table
              columns={columns}
              dataSource={filteredCandidates}
              rowKey="id"
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) => 
                  `${range[0]}-${range[1]} of ${total} candidates`,
              }}
            />
          ) : (
            <Empty
              description={
                <div>
                  <Text type="secondary">No candidates found</Text>
                  {searchTerm && (
                    <div className="mt-2">
                      <Button type="link" onClick={() => setSearchTerm('')}>
                        Clear search
                      </Button>
                    </div>
                  )}
                </div>
              }
            />
          )}
        </Card>
      </div>
    </div>
  );
};

export default Interviewer;