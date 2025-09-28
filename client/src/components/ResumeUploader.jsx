import React, { useState, useCallback } from "react";
import {
  Upload,
  Button,
  Card,
  Form,
  Input,
  Tag,
  Space,
  Alert,
  Spin,
} from "antd";
import {
  InboxOutlined,
  FileTextOutlined,
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
} from "@ant-design/icons";
import { useDispatch } from "react-redux";
import { parseResume, validateResumeData } from "../utils/resumeParser";
import { addCandidate } from "../redux/candidateSlice";

const { Dragger } = Upload;
const { TextArea } = Input;

const ResumeUploader = ({ onComplete }) => {
  const [form] = Form.useForm();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [parseError, setParseError] = useState(null);
  const [parsedData, setParsedData] = useState(null);
  const [fileUploaded, setFileUploaded] = useState(false);

  const handleFileUpload = useCallback(
    async (file) => {
      setLoading(true);
      setParseError(null);

      try {
        const data = await parseResume(file);
        setParsedData(data);

        form.setFieldsValue({
          name: data.name,
          email: data.email,
          phone: data.phone,
          experience: data.experience,
          skills: data.skills.join(", "),
        });

        setFileUploaded(true);
      } catch (error) {
        setParseError(error.message);
      } finally {
        setLoading(false);
      }

      return false;
    },
    [form]
  );

  const handleSubmit = async (values) => {
    try {
      const validation = validateResumeData(values);

      if (!validation.isValid) {
        validation.errors.forEach((error) => {
          console.error(error);
        });
        return;
      }

      const candidateData = {
        ...values,
        skills: values.skills
          ? values.skills
              .split(",")
              .map((s) => s.trim())
              .filter((s) => s)
          : [],
        resumeData: parsedData,
        uploadedAt: new Date().toISOString(),
      };

      dispatch(addCandidate(candidateData));

      if (onComplete) {
        onComplete(candidateData);
      }
    } catch (error) {
      console.error("Error creating candidate:", error);
    }
  };

  const uploadProps = {
    name: "resume",
    multiple: false,
    accept: ".pdf,.docx",
    showUploadList: false,
    customRequest: async ({ file, onSuccess, onError }) => {
      try {
        await handleFileUpload(file);
        onSuccess("ok");
      } catch (error) {
        onError(error);
      }
    },
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Upload Your Resume
        </h2>
        <p className="text-gray-600">
          Upload your resume and we'll extract your information automatically
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card
          title={
            <Space>
              <FileTextOutlined className="text-blue-500" />
              Resume Upload
            </Space>
          }
          className="shadow-sm"
        >
          <Dragger
            {...uploadProps}
            className={`${fileUploaded ? "border-green-400 bg-green-50" : ""}`}
            disabled={loading}
          >
            <p className="ant-upload-drag-icon">
              {loading ? <Spin size="large" /> : <InboxOutlined />}
            </p>
            <div className="ant-upload-text">
              {loading
                ? "Parsing resume..."
                : "Click or drag resume to this area to upload"}
            </div>
            <div className="ant-upload-hint">
              Support for PDF and DOCX files. Your resume will be parsed
              automatically.
            </div>
          </Dragger>

          {parseError && (
            <Alert
              message="Parsing Error"
              description={parseError}
              type="error"
              className="mt-4"
              showIcon
            />
          )}

          {parsedData && (
            <Alert
              message="Resume Parsed Successfully!"
              description="Your information has been extracted and filled in the form. Please review and submit."
              type="success"
              className="mt-4"
              showIcon
            />
          )}
        </Card>

        <Card
          title={
            <Space>
              <UserOutlined className="text-blue-500" />
              Candidate Information
            </Space>
          }
          className="shadow-sm"
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            className="space-y-4"
          >
            <Form.Item
              label="Full Name"
              name="name"
              rules={[
                { required: true, message: "Please enter your full name" },
                { min: 2, message: "Name must be at least 2 characters" },
              ]}
            >
              <Input
                placeholder="Enter your full name"
                prefix={<UserOutlined />}
                size="large"
              />
            </Form.Item>

            <Form.Item
              label="Email Address"
              name="email"
              rules={[
                { required: true, message: "Please enter your email" },
                { type: "email", message: "Please enter a valid email" },
              ]}
            >
              <Input
                placeholder="Enter your email address"
                prefix={<MailOutlined />}
                size="large"
              />
            </Form.Item>

            <Form.Item
              label="Phone Number"
              name="phone"
              rules={[
                { required: true, message: "Please enter your phone number" },
                { min: 10, message: "Please enter a valid phone number" },
              ]}
            >
              <Input
                placeholder="Enter your phone number"
                prefix={<PhoneOutlined />}
                size="large"
              />
            </Form.Item>

            <Form.Item label="Years of Experience" name="experience">
              <Input placeholder="e.g., 3 years, 5+ years" size="large" />
            </Form.Item>

            <Form.Item
              label="Skills"
              name="skills"
              help="Separate multiple skills with commas"
            >
              <TextArea
                placeholder="e.g., React, Node.js, JavaScript, Python"
                rows={3}
                size="large"
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                className="w-full"
                disabled={!fileUploaded}
              >
                Start Interview
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </div>

      {parsedData?.skills && parsedData.skills.length > 0 && (
        <Card title="Detected Skills" className="mt-6 shadow-sm">
          <div className="flex flex-wrap gap-2">
            {parsedData.skills.map((skill, index) => (
              <Tag key={index} color="blue" className="mb-2">
                {skill}
              </Tag>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default ResumeUploader;
