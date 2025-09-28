import React, { useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { decrementTimer, stopTimer } from '../redux/interviewSlice';
import { Progress, Card } from 'antd';
import { ClockCircleOutlined } from '@ant-design/icons';

const Timer = ({ onTimeUp, totalTime }) => {
  const dispatch = useDispatch();
  const { timeRemaining, isTimerActive } = useSelector(state => state.interviews);

  const handleTimeUp = useCallback(() => {
    dispatch(stopTimer());
    if (onTimeUp) {
      onTimeUp();
    }
  }, [dispatch, onTimeUp]);

  useEffect(() => {
    let interval = null;
    
    if (isTimerActive && timeRemaining > 0) {
      interval = setInterval(() => {
        dispatch(decrementTimer());
      }, 1000);
    } else if (timeRemaining === 0) {
      handleTimeUp();
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isTimerActive, timeRemaining, dispatch, handleTimeUp]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgressColor = () => {
    const percentage = (timeRemaining / totalTime) * 100;
    if (percentage > 50) return '#52c41a';
    if (percentage > 20) return '#fa8c16';
    return '#ff4d4f';
  };

  const percentage = totalTime > 0 ? (timeRemaining / totalTime) * 100 : 0;

  return (
    <Card 
      className="w-full shadow-sm"
      bodyStyle={{ padding: '16px' }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <ClockCircleOutlined className="text-blue-500" />
          <span className="text-sm font-medium text-gray-700">Time Remaining</span>
        </div>
        <span 
          className={`text-lg font-mono font-bold ${
            timeRemaining <= 30 ? 'text-red-500' : 
            timeRemaining <= 60 ? 'text-orange-500' : 
            'text-green-500'
          }`}
        >
          {formatTime(timeRemaining)}
        </span>
      </div>
      
      <Progress
        percent={percentage}
        showInfo={false}
        strokeColor={getProgressColor()}
        trailColor="#f0f0f0"
        strokeWidth={8}
        className="mb-2"
      />
      
      <div className="text-xs text-gray-500 text-center">
        {isTimerActive ? 'Timer is running' : 'Timer paused'}
      </div>
    </Card>
  );
};

export default Timer;