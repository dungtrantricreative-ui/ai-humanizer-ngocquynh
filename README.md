# AI Text Humanizer Chatbot

This project is a web chatbot designed to humanize AI-generated text, making it sound more natural and human-like. It utilizes the NVIDIA Nemotron model via the OpenRouter API and employs a 4-step pipeline including multiple rewrites and translation hops to achieve high-quality humanization. The frontend is a simple chat interface built with HTML, TailwindCSS, and JavaScript, while the backend is powered by FastAPI.

## Mục đích

Web chatbot cho phép người dùng dán văn bản do AI tạo ra và nhận lại văn bản đã được humanize (giống người viết, vượt qua AI detector như Turnitin, GPTZero).

## Tech Stack

- **Backend**: Python + FastAPI
- **Frontend**: HTML + TailwindCSS + JavaScript (simple chat interface)
- **API**: OpenRouter API (NVIDIA Nemotron)
- **Deployment**: Render.com

## AI Model

- **Model**: `nvidia/nemotron-3-ultra-550b-a55b:free`
- **API Base**: `https://openrouter.ai/api/v1`
- **API Key**: Lấy từ biến môi trường `OPENROUTER_API_KEY`

## Pipeline (4 bước humanization)

1.  **Bước 1**: Input text → Viết lại bằng Nemotron (humanization rewrite #1)
2.  **Bước 2**: Viết lại bằng Nemotron lần 2 (humanization rewrite #2)
3.  **Bước 3**: Translation hop #1 (qua ngôn ngữ khác rồi quay lại ngôn ngữ gốc)
4.  **Bước 4**: Translation hop #2 (qua ngôn ngữ khác rồi quay lại ngôn ngữ gốc)

**Output**: Văn bản đã được humanized.

## Đa ngôn ngữ

Ứng dụng hỗ trợ các ngôn ngữ sau:
-   Tiếng Việt (`vi`)
-   English (`en`)
-   Chinese (`zh`)
-   Japanese (`ja`)

Người dùng có thể chọn ngôn ngữ đầu vào trong giao diện người dùng.

## Cấu trúc dự án

```
my-humanize-chatbot/
├── src/
│   ├── __init__.py
│   ├── pipeline.py          # 4-step pipeline dùng Nemotron
│   ├── api.py               # FastAPI routes (/humanize, /chat)
│   ├── nemotron_client.py   # OpenRouter API client
│   └── utils.py             # (Hiện tại chưa có nội dung, có thể mở rộng sau)
├── static/
│   ├── index.html           # Chatbot UI
│   ├── styles.css
│   └── app.js
├── config/
│   └── settings.py          # Config API keys, env vars
├── requirements.txt
├── main.py                  # Entry point FastAPI
├── render.yaml              # Render.com deployment config
├── .env.example
├── .gitignore
└── README.md
```

## Hướng dẫn cài đặt và chạy Local

### 1. Clone repository (nếu có)

```bash
git clone <repo_url>
cd my-humanize-chatbot
```

### 2. Tạo và kích hoạt môi trường ảo

```bash
python3 -m venv venv
source venv/bin/activate  # Trên Linux/macOS
# venv\Scripts\activate   # Trên Windows
```

### 3. Cài đặt các thư viện cần thiết

```bash
pip install -r requirements.txt
```

### 4. Cấu hình biến môi trường

Tạo một file `.env` trong thư mục gốc của dự án và thêm `OPENROUTER_API_KEY` của bạn:

```dotenv
OPENROUTER_API_KEY="sk-YOUR_OPENROUTER_API_KEY"
```

Bạn có thể lấy `OPENROUTER_API_KEY` từ trang web của OpenRouter.

### 5. Chạy ứng dụng FastAPI

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Ứng dụng sẽ chạy tại `http://localhost:8000`.

## API Documentation

Ứng dụng cung cấp các API endpoint sau:

### `POST /humanize`

Endpoint này nhận một đoạn văn bản và ngôn ngữ, sau đó trả về phiên bản đã được humanize của văn bản đó.

-   **URL**: `/humanize`
-   **Method**: `POST`
-   **Request Body (JSON)**:
    ```json
    {
        "text": "Văn bản AI cần humanize",
        "language": "vi" // hoặc "en", "zh", "ja"
    }
    ```
-   **Response Body (JSON)**:
    ```json
    {
        "humanized_text": "Văn bản đã được humanize"
    }
    ```
-   **HTTP Status Codes**:
    -   `200 OK`: Thành công
    -   `500 Internal Server Error`: Lỗi trong quá trình xử lý humanization

### `POST /chat`

Endpoint này là một placeholder cho giao diện chat phức tạp hơn. Hiện tại, nó có thể được sử dụng để nhận phản hồi đơn giản từ Nemotron.

-   **URL**: `/chat`
-   **Method**: `POST`
-   **Request Body (JSON)**:
    ```json
    [
        {
            "role": "user",
            "content": "Hello, how are you?"
        }
    ]
    ```
-   **Response Body (JSON)**:
    ```json
    {
        "reply": "Phản hồi từ AI"
    }
    ```
-   **HTTP Status Codes**:
    -   `200 OK`: Thành công
    -   `400 Bad Request`: Không có nội dung tin nhắn
    -   `500 Internal Server Error`: Lỗi trong quá trình xử lý chat

### `GET /`

Trả về file `index.html` tĩnh, là giao diện người dùng của chatbot.

-   **URL**: `/`
-   **Method**: `GET`
-   **Response**: HTML Content

## Hướng dẫn Deploy lên Render.com

Render.com là một nền tảng cloud giúp triển khai ứng dụng dễ dàng. Dưới đây là các bước để deploy dự án này:

### 1. Chuẩn bị tài khoản Render.com

Đảm bảo bạn có tài khoản Render.com và đã kết nối với tài khoản GitHub/GitLab của bạn.

### 2. Tạo file `render.yaml`

File `render.yaml` đã được cung cấp trong dự án này để cấu hình dịch vụ web trên Render.com.

### 3. Tạo một Web Service mới trên Render.com

-   Đăng nhập vào Render.com dashboard.
-   Nhấp vào `New > Web Service`.
-   Chọn repository GitHub/GitLab của bạn (nơi chứa dự án này).
-   **Tên**: Đặt tên cho dịch vụ của bạn (ví dụ: `ai-humanizer-chatbot`).
-   **Region**: Chọn khu vực gần bạn nhất.
-   **Branch**: Chọn branch mà bạn muốn deploy (thường là `main` hoặc `master`).
-   **Root Directory**: Để trống hoặc `.` nếu `render.yaml` nằm ở thư mục gốc.
-   **Runtime**: `Python 3`
-   **Build Command**: `pip install -r requirements.txt`
-   **Start Command**: `uvicorn main:app --host 0.0.0.0 --port 8000`

### 4. Cấu hình biến môi trường trên Render.com

-   Trong phần cài đặt dịch vụ của bạn trên Render.com, đi tới `Environment`.
-   Thêm biến môi trường `OPENROUTER_API_KEY` với giá trị API key của bạn.

### 5. Deploy

-   Sau khi cấu hình xong, nhấp vào `Create Web Service`.
-   Render.com sẽ tự động build và deploy ứng dụng của bạn. Bạn có thể theo dõi tiến trình trong phần logs.

Sau khi deploy thành công, bạn sẽ có một URL công khai cho ứng dụng chatbot của mình.
