import React, { useEffect, useState } from "react";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { ConfigProvider, Tabs, Spin, message } from "antd";
import { UserOutlined, TeamOutlined } from "@ant-design/icons";
import { store, persistor } from "./redux/store";
import Interviewee from "./pages/Interviewee";
import Interviewer from "./pages/Interviewer";
import axios from "axios";

function App() {
  const [apiReady, setApiReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";
  console.log("Using API URL:", API_URL);

  const checkApi = async () => {
    try {
      const response = await axios.get(`${API_URL}/health`); // Replace with your test route
      if (response.status === 200) {
        setApiReady(true);
      } else {
        message.error("API not available. Please try again later.");
      }
    } catch (error) {
      console.error("API check failed:", error);
      message.error("API not reachable. Please check your connection or try later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkApi();
  }, []);

  const items = [
    {
      key: "interviewee",
      label: (
        <span className="flex items-center space-x-2 px-4">
          <UserOutlined />
          <span>Interviewee</span>
        </span>
      ),
      children: <Interviewee />,
    },
    {
      key: "interviewer",
      label: (
        <span className="flex items-center space-x-2 px-4">
          <TeamOutlined />
          <span>Interviewer Dashboard</span>
        </span>
      ),
      children: <Interviewer />,
    },
  ];

  return (
    <Provider store={store}>
      <PersistGate
        loading={
          <div className="flex items-center justify-center h-screen">
            <Spin size="large" />
          </div>
        }
        persistor={persistor}
      >
        <ConfigProvider
          theme={{
            token: {
              colorPrimary: "#1890ff",
              borderRadius: 8,
              fontSize: 14,
            },
          }}
        >
          <div className="min-h-screen bg-gray-50">
            {loading ? (
              <div className="flex items-center justify-center h-screen">
                <Spin size="large" tip="Connecting to API..." />
              </div>
            ) : apiReady ? (
              <Tabs
                defaultActiveKey="interviewee"
                centered
                size="large"
                className="bg-white shadow-sm"
                tabBarStyle={{
                  margin: 0,
                  padding: "0 24px",
                  borderBottom: "1px solid #f0f0f0",
                }}
                items={items}
              />
            ) : (
              <div className="flex items-center justify-center h-screen text-red-500">
                Unable to connect to API. Please refresh or try again later.
              </div>
            )}
          </div>
        </ConfigProvider>
      </PersistGate>
    </Provider>
  );
}

export default App;