import streamlit as st
import requests
import tempfile
import json

API_URL = "http://localhost:9000"

st.set_page_config(page_title="InterVueAI Tester", layout="wide")
st.title("🧠 InterVueAI – LLM Engine Tester")

# --------------------- Helpers ---------------------
def call_api(endpoint, payload):
    try:
        res = requests.post(f"{API_URL}{endpoint}", json=payload)
        return res.json()
    except Exception as e:
        return {"error": str(e)}

# --------------------- Tabs ---------------------
tabs = st.tabs([
    "📝 Generate Questions",
    "✅ Evaluate Answer",
    "📄 Resume Parser",
    "🏗️ System Design Review",
    "💻 Code Review",
    "❤️ Health Check"
])

# --------------------- Generate Questions Tab ---------------------
with tabs[0]:
    st.header("Generate Interview Questions")

    role = st.text_input("Job Role", "Backend Engineer")
    level = st.text_input("Experience Level", "Mid")
    resume = st.text_area("Resume Text", "Node.js, FastAPI, AWS, microservices...")
    count = st.slider("Number of Questions", 1, 10, 5)

    if st.button("Generate Questions"):
        data = {
            "role": role,
            "level": level,
            "resume_text": resume,
            "count": count
        }
        out = call_api("/questions", data)

        if isinstance(out, list):
            st.success(f"✅ Generated {len(out)} Interview Questions")

            for i, q in enumerate(out, 1):
                with st.container():
                    st.markdown(f"### 🧾 Question {i}")
                    st.write(q.get("question", ""))

                    with st.expander("Model Answer"):
                        st.write(q.get("model_answer", ""))

                    with st.expander("Evaluation Rubric"):
                        rubric_list = q.get("rubric", [])
                        if isinstance(rubric_list, list) and len(rubric_list) > 0:
                            for item in rubric_list:
                                st.markdown(f"- {item}")
                        else:
                            st.code(json.dumps(rubric_list, indent=2))

                    st.markdown("---")
        else:
            st.error("❌ Failed to generate questions")
            st.json(out)

# --------------------- Evaluate Answer Tab ---------------------
with tabs[1]:
    st.header("Evaluate Candidate Answer")

    model_answer = st.text_area("Ideal Answer", "")
    candidate_answer = st.text_area("Candidate Answer", "")
    rubric = st.text_input("Rubric (comma separated)", "clarity, accuracy")

    if st.button("Evaluate Answer"):
        data = {
            "model_answer": model_answer,
            "candidate_answer": candidate_answer,
            "rubric": [r.strip() for r in rubric.split(",")]
        }
        out = call_api("/evaluate", data)
        st.json(out)

# --------------------- Resume Parser Tab ---------------------
with tabs[2]:
    st.header("Resume Parser (PDF)")

    uploaded_file = st.file_uploader("Upload PDF Resume", type=["pdf"])

    if uploaded_file:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
            tmp.write(uploaded_file.read())
            tmp_path = tmp.name

        st.success(f"Uploaded: {uploaded_file.name}")

        if st.button("Parse Resume"):
            data = {"file_path": tmp_path}
            out = call_api("/resume", data)
            st.json(out)

# --------------------- Design Review Tab ---------------------
with tabs[3]:
    st.header("System Design Review")

    prompt = st.text_area("Design Problem", "Design scalable video streaming service")
    context = st.text_area("Context", "AWS | CDN | Microservices | Cache", height=100)

    if st.button("Review Architecture"):
        data = {"prompt": prompt, "context": context}
        out = call_api("/design_review", data)
        st.json(out)

# --------------------- Code Review Tab ---------------------
with tabs[4]:
    st.header("Code Review")

    expected_solution = st.text_area("Expected Logic", "Return factorial...")
    user_code = st.text_area("Candidate Code", "function fact(n){ return n<=1?1:n*fact(n-1)}")
    language = st.selectbox("Language", ["Python", "JavaScript", "Java", "C++"])

    if st.button("Review Code"):
        data = {
            "expected_solution": expected_solution,
            "user_code": user_code,
            "language": language
        }
        out = call_api("/code_review", data)
        st.json(out)

# --------------------- Health Check Tab ---------------------
with tabs[5]:
    st.header("Service Health Check")

    if st.button("Check Health"):
        try:
            res = requests.get(f"{API_URL}/health")
            st.json(res.json())
        except Exception as e:
            st.error(str(e))