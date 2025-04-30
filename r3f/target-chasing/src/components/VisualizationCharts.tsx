import React, {
  useEffect,
  useState,
} from 'react';

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { useTrainingStore } from '../store/trainingStore';

// Define the data structure for our charts
interface DataPoint {
  step: number;
  reward?: number;
  loss?: number;
  epsilon?: number;
}

interface VisualizationChartsProps {
  maxDataPoints?: number;
}

export function VisualizationCharts({ maxDataPoints = 100 }: VisualizationChartsProps) {
  // State to store historical data
  const [rewardHistory, setRewardHistory] = useState<DataPoint[]>([]);
  const [lossHistory, setLossHistory] = useState<DataPoint[]>([]);
  const [epsilonHistory, setEpsilonHistory] = useState<DataPoint[]>([]);
  
  // Get current values from the training store
  const { 
    reward, 
    episodeSteps,
    isTraining,
    episodeCount
  } = useTrainingStore();

  // Get epsilon from the agent (we'll need to add this to the store)
  // For now, we'll simulate epsilon decay
  const [simulatedEpsilon, setSimulatedEpsilon] = useState(1.0);
  const [simulatedLoss, setSimulatedLoss] = useState(0.5);

  // Update epsilon simulation
  useEffect(() => {
    if (isTraining) {
      // Simulate epsilon decay (starting at 1.0, decaying to 0.01)
      const newEpsilon = Math.max(0.01, 1.0 * Math.pow(0.995, episodeCount));
      setSimulatedEpsilon(newEpsilon);
      
      // Simulate loss (starting high, gradually decreasing with fluctuations)
      const baseLoss = 0.5 * Math.pow(0.99, episodeCount);
      const randomFactor = Math.random() * 0.1 - 0.05; // Random fluctuation between -0.05 and 0.05
      setSimulatedLoss(Math.max(0.01, baseLoss + randomFactor));
    }
  }, [episodeCount, isTraining]);

  // Update charts when reward changes
  useEffect(() => {
    if (isTraining) {
      // Add new data point to reward history
      const newRewardPoint: DataPoint = {
        step: episodeSteps,
        reward: reward
      };
      
      setRewardHistory(prev => {
        const newHistory = [...prev, newRewardPoint];
        // Keep only the most recent points to avoid performance issues
        return newHistory.slice(-maxDataPoints);
      });
      
      // Add new data point to loss history
      const newLossPoint: DataPoint = {
        step: episodeSteps,
        loss: simulatedLoss
      };
      
      setLossHistory(prev => {
        const newHistory = [...prev, newLossPoint];
        return newHistory.slice(-maxDataPoints);
      });
      
      // Add new data point to epsilon history
      const newEpsilonPoint: DataPoint = {
        step: episodeSteps,
        epsilon: simulatedEpsilon
      };
      
      setEpsilonHistory(prev => {
        const newHistory = [...prev, newEpsilonPoint];
        return newHistory.slice(-maxDataPoints);
      });
    }
  }, [reward, episodeSteps, isTraining, simulatedEpsilon, simulatedLoss, maxDataPoints]);

  // Reset charts when training is stopped
  useEffect(() => {
    if (!isTraining) {
      // Keep the data but don't update it
    }
  }, [isTraining]);

  return (
    <div className="visualization-charts">
      <h3>Training Visualization</h3>
      
      {/* Reward Chart */}
      <div className="chart-container">
        <h4>Reward Over Time</h4>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart
            data={rewardHistory}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="step" label={{ value: 'Steps', position: 'insideBottomRight', offset: -5 }} />
            <YAxis label={{ value: 'Reward', angle: -90, position: 'insideLeft' }} />
            <Tooltip />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="reward" 
              stroke="#8884d8" 
              activeDot={{ r: 8 }} 
              isAnimationActive={false} 
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      {/* Loss Chart */}
      <div className="chart-container">
        <h4>Loss Over Time</h4>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart
            data={lossHistory}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="step" label={{ value: 'Steps', position: 'insideBottomRight', offset: -5 }} />
            <YAxis label={{ value: 'Loss', angle: -90, position: 'insideLeft' }} />
            <Tooltip />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="loss" 
              stroke="#82ca9d" 
              isAnimationActive={false} 
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      {/* Epsilon Chart */}
      <div className="chart-container">
        <h4>Epsilon Decay</h4>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart
            data={epsilonHistory}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="step" label={{ value: 'Steps', position: 'insideBottomRight', offset: -5 }} />
            <YAxis 
              label={{ value: 'Epsilon', angle: -90, position: 'insideLeft' }}
              domain={[0, 1]} 
            />
            <Tooltip />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="epsilon" 
              stroke="#ff7300" 
              isAnimationActive={false} 
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
