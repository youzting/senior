const express = require('express');
const mysql = require('mysql2');
const session = require('express-session');
const app = express();
const port = 3000;

// MySQL 연결
const db = mysql.createConnection({
  host: '116.124.191.174',
  port: '15016',
  user: 'kdh_2023605',
  password: 'kdh_2023605',
  database: 'kdh_2023605'
});

// DB 연결 확인
db.connect(err => {
  if (err) throw err;
  console.log('MySQL connected...');
});

// 세션 설정
app.use(session({ secret: 'your-secret', resave: false, saveUninitialized: true }));

// EJS 설정
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));

// 홈 페이지
app.get('/', (req, res) => {
  const username = req.session.username;  // 세션에서 로그인된 사용자 정보 가져오기
  res.render('index', { username });  // EJS 템플릿에 username 전달
});

// 로그인 페이지
app.get('/login', (req, res) => {
  res.render('login');  // 로그인 페이지 렌더링
});

// 로그아웃
app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

// 마이 페이지 라우팅
app.get('/mypage', (req, res) => {
    const userId = 1;  // 예시 사용자 ID, 실제로는 세션이나 인증을 통해 결정됨
    db.query('SELECT * FROM users WHERE id = ?', [userId], (err, result) => {
      if (err) throw err;
      const user = result[0];
      res.render('mypage', { user });
    });
  });
  
  // 프로필 수정 처리
  app.post('/mypage/update', (req, res) => {
    const { username, password, email, phone, birthdate, age, gender, interests, health_conditions } = req.body;
    const userId = 1;  // 예시 사용자 ID
    db.query('UPDATE users SET password = ?, email = ?, phone = ?, birthdate = ?, age = ?, gender = ?, interests = ?, health_conditions = ? WHERE id = ?',
      [password, email, phone, birthdate, age, gender, interests, health_conditions, userId], (err, result) => {
        if (err) throw err;
        res.redirect('/mypage');  // 수정 후 마이 페이지로 리다이렉션
      });
  });

// 유저 매칭 페이지
app.get('/matching', (req, res) => {
  db.query('SELECT * FROM users', (err, results) => {
    if (err) throw err;
    res.render('matching', { users: results });  // 유저 목록을 matching 페이지에 전달
  });
});

// 유저 프로필 페이지
app.get('/user/:id', (req, res) => {
  const userId = req.params.id;
  db.query('SELECT * FROM users WHERE id = ?', [userId], (err, result) => {
    if (err) throw err;
    res.render('user-profile', { user: result[0] });  // 해당 유저의 프로필을 렌더링
  });
});

// 서버 실행
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
