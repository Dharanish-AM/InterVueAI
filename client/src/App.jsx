import React from "react";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { ConfigProvider, Tabs, Spin } from "antd";
import { UserOutlined, TeamOutlined } from "@ant-design/icons";
import { store, persistor } from "./redux/store";
import Interviewee from "./pages/Interviewee";
import Interviewer from "./pages/Interviewer";

function App() {
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
          </div>
        </ConfigProvider>
      </PersistGate>
    </Provider>
  );
}

export default App;
