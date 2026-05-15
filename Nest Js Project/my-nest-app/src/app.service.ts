import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>NestJS Page</title>
      <style>
        body {
          margin: 0;
          font-family: Arial;
          background: linear-gradient(135deg, #667eea, #764ba2);
          height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
          color: white;
        }

        .card {
          background: rgba(255,255,255,0.1);
          padding: 40px;
          border-radius: 12px;
          text-align: center;
          box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        }

        button {
          margin-top: 20px;
          padding: 10px 20px;
          border: none;
          border-radius: 6px;
          background: orange;
          color: white;
          cursor: pointer;
          font-size: 16px;
        }

        button:hover {
          background: red;
        }

        #msg {
          margin-top: 20px;
          font-size: 18px;
          font-weight: bold;
        }
      </style>
    </head>
    <body>

      <div class="card">
        <h1>🚀 NestJS UI Page</h1>
        <p>Click button to load message</p>

        <button onclick="showMsg()">Get Message</button>

        <div id="msg"></div>
      </div>

      <script>
        function showMsg() {
          document.getElementById('msg').innerText = 'Hello World user!';
        }
      </script>

    </body>
    </html>
    `;
  }
}
