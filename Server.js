const express = require('express');
const mysql = require('mysql2');
const path = require('path');
const session = require('express-session');
const bodyParser = require('body-parser');
const app = express();

// MySQL 연결
const db = mysql.createConnection({
    host: 'localhost',
    user: 'kdh_2023605',
    password: 'kdh_2023605',
    database: 'kdh_2023605'
});

db.connect((err) => {
  if (err) {
      console.error('MySQL 연결 실패:', err);
      return;
  }
  console.log('MySQL에 성공적으로 연결되었습니다.');
});

// 서버에서 static 파일 제공 (HTML, CSS, JS 등)
app.use(express.static(path.join(__dirname, 'public')));

// EJS 설정
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// 세션 설정
app.use(session({ secret: 'your-secret', resave: false, saveUninitialized: true }));

// 홈 페이지
app.get('/home', (req, res) => {
    const username = req.session.username;  // 세션에서 로그인된 사용자 정보 가져오기
    res.render('home', { username });  // EJS 템플릿에 username 전달
});


app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'home.html')); //홈
});




// 서버 실행
app.listen(15016, '0.0.0.0', () => {  // 모든 네트워크 인터페이스에서 포트 열기
  console.log('서버가 0.0.0.0:15016 포트에서 실행 중...');
});

