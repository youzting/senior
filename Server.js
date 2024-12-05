const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const app = express();
const path = require('path');
const session = require('express-session');
const mySQLStore = require('express-mysql-session')(session);
const sessionStore = new mySQLStore({}, db);

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

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// 세션 설정
app.use(session({
    key: 'user_sid',
    secret: 'your-secret',
    store: sessionStore,
    resave: false,
    saveUninitialized: false
}));

// 아이디 중복 확인 API
app.post('/check-username', (req, res) => {
  const username = req.body.username;
  db.query('SELECT * FROM users WHERE username = ?', [username], (err, result) => {
      if (err) throw err;
      if (result.length > 0) {
          res.json({ available: false });
      } else {
          res.json({ available: true });
      }
  });
});

// 회원가입
app.post('/signup', (req, res) => {
  const { username, password, email, phone, birthdate, age, gender, interests, health_conditions } = req.body;
  db.query('INSERT INTO users (username, password, email, phone, birthdate, age, gender, interests, health_conditions) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [username, password, email, phone, birthdate, age, gender, interests, health_conditions], (err, result) => {
          if (err) throw err;
          res.send('회원가입이 완료되었습니다.');
      });
});

// 로그인 페이지
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// 로그인 처리
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    db.query('SELECT * FROM users WHERE username = ? AND password = ?', [username, password], (err, result) => {
        if (err) throw err;
        if (result.length > 0) {
            req.session.username = username;  // 로그인 성공 시 세션에 사용자 이름 저장
            res.redirect('/');  // 홈 페이지로 리다이렉트
        } else {
            res.send('Invalid username or password');
        }
    });
});

// 로그아웃
app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

// 회원가입 페이지
app.get('/signup', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'signup.html'));
});

// 마이 페이지 라우팅
app.get('/mypage', (req, res) => {
  const userId = 1;  // 예시 사용자 ID, 실제로는 세션이나 인증을 통해 결정됨
  db.query('SELECT * FROM users WHERE id = ?', [userId], (err, result) => {
    if (err) throw err;
    const user = result[0];
    res.sendFile(path.join(__dirname, 'public', 'mypage.html')); // 마이페이지 HTML 제공
  });
});

// 홈 페이지 라우팅
app.get('/hobbyRec', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'hobbyRec.html'));
});

// 유저 매칭 페이지
app.get('/matching', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'matching.html'));
});

// 프로그램 신청 페이지
app.get('/program', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'program.html'));
});

// 유저 프로필 페이지
app.get('/user/:id', (req, res) => {
  const userId = req.params.id;
  db.query('SELECT * FROM users WHERE id = ?', [userId], (err, result) => {
    if (err) throw err;
    res.sendFile(path.join(__dirname, 'public', 'user-profile.html'));
  });
});

// 요가 클래스 상세 페이지
app.get('/yoga-class', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'yoga-class.html'));
});

// 메시지와 URL을 렌더링하는 라우트
app.get('/alert', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'alert.html'));
});



app.listen(15016, '0.0.0.0', () => {  // 모든 네트워크 인터페이스에서 포트 열기
  console.log('서버가 0.0.0.0:15016 포트에서 실행 중...');
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'home.html')); //홈
});

app.get('/home', (req, res) => {
    const username = req.session.username;  // 세션에서 로그인된 사용자 정보 가져오기
    res.render('home', { username });  // EJS 템플릿에 username 전달
});

app.get('/hobbyRec', (req, res) => {
  res.sendFile(path.join(__dirname, 'hobbyRec.html'));
});

app.get('/matching', (req, res) => {
  res.sendFile(path.join(__dirname, 'matching.html'));
});

app.get('/chat', (req, res) => {
  res.sendFile(path.join(__dirname, 'chat.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'login.html'));
});

app.get('/signup', (req, res) => {
  res.sendFile(path.join(__dirname, 'signup.html'));
});

app.get('/mypage', (req, res) => {
  res.sendFile(path.join(__dirname, 'mypage.html'));
});

app.get('/popup', (req, res) => {
  res.sendFile(path.join(__dirname, 'popup.html'));
});

app.get('/progApply', (req, res) => {
  res.sendFile(path.join(__dirname, 'progApply.html'));
});

app.get('/program', (req, res) => {
  res.sendFile(path.join(__dirname, 'program.html'));
});

app.get('/progInfo', (req, res) => {
  res.sendFile(path.join(__dirname, 'progInfo.html'));
});

app.get('/user', (req, res) => {
  res.sendFile(path.join(__dirname, 'user.html'));
});
