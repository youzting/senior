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

// 세션 설정--------------------------------------
app.use(session({ secret: 'your-secret', resave: false, saveUninitialized: true }));


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

// 회원가입 처리
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
    res.render('login');  // 로그인 페이지 렌더링
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
    res.render('signup');  // 회원가입 페이지 렌더링
});

// 회원가입 처리
app.post('/signup', (req, res) => {
    const { username, password } = req.body;
    db.query('SELECT * FROM users WHERE username = ?', [username], (err, result) => {
        if (err) throw err;
        if (result.length > 0) {
            res.send('Username already exists');
        } else {
            db.query('INSERT INTO users (username, password) VALUES (?, ?)', [username, password], (err, result) => {
                if (err) throw err;
                res.redirect('/login');  // 로그인 페이지로 리다이렉트
            });
        }
    });
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

// 홈 페이지 라우팅
app.get('/hobbyRec', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'hobbyRec.html'));
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

// 프로그램 신청 페이지
app.get('/program', (req, res) => {
  res.render('program');
});

// 리마인더 페이지
app.get('/reminder_page', (req, res) => {
  res.send("리마인더 설정이 완료되었습니다.");
});

// 신청서 제출
app.post('/submit', (req, res) => {
  const { preferred_date, preferred_time } = req.body;
  // 신청서 데이터 처리 (예: DB 저장 등)
  console.log(`신청 날짜: ${preferred_date}, 신청 시간: ${preferred_time}`);

  res.send("신청이 완료되었습니다.");
});

// 요가 클래스 상세 페이지
app.get('/yoga-class', (req, res) => {
  // 요가 클래스 정보를 EJS 템플릿에 전달
  res.render('yoga-class', {
    location: '서울',
    schedule: '매주 화요일 오전 10:00',
    status: '모집 중',
    startDate: '2024-01-15',
    endDate: '2024-12-20',
    participants: '8 / 15',
    rating: '4.5 / 5.0',
  });
});

// 신청하기 페이지로 리다이렉션
app.post('/apply', (req, res) => {
  // 신청서 제출 처리 로직 (예: DB 저장)
  const { name, email } = req.body;
  console.log(`신청자 이름: ${name}, 이메일: ${email}`);
  res.send('신청이 완료되었습니다.');
});

// 메시지와 URL을 렌더링하는 라우트
app.get('/alert', (req, res) => {
  const msg = '안내 메시지입니다'; // 메시지
  const url = req.query.url || 'back'; // URL 파라미터 (기본값은 'back')
  res.render('alert', { msg, url }); // EJS 템플릿에 메시지와 URL 전달
});

const programs = [
  { id: 1, name: "요가 클래스", location: "서울", schedule: "매주 화요일 10:00" },
  { id: 2, name: "코딩 부트캠프", location: "온라인", schedule: "매주 토요일 14:00" }
];


// Route to handle reminder request (simulating reminder setting)
app.post('/set-reminder', (req, res) => {
  const programId = req.body.programId;
  // In real application, save reminder to the database or perform actions.
  console.log(`Reminder set for program ID: ${programId}`);
  res.send(`<h1>리마인더가 설정되었습니다!</h1><p>프로그램 ID: ${programId}</p>`);
});

// Route to render a specific program info page (example)
app.get('/progInfo', (req, res) => {
  res.render('program-info', { program: programs[0] });
});

app.get('/user', (req, res) => {
  res.render('user');
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

app.get('/HobbyRec', (req, res) => {
  res.sendFile(path.join(__dirname, 'HobbyRec.html'));
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

app.get('/Program', (req, res) => {
  res.sendFile(path.join(__dirname, 'Program.html'));
});

app.get('/progInfo', (req, res) => {
  res.sendFile(path.join(__dirname, 'progInfo.html'));
});

app.get('/user', (req, res) => {
  res.sendFile(path.join(__dirname, 'user.html'));
});
