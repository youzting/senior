require('dotenv').config();
const express = require('express');
const nunjucks = require('nunjucks');
const cors = require('cors');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const path = require('path');
const bcrypt = require('bcrypt');

const app = express();

// MySQL 연결 설정
const db = mysql.createConnection({
    host: 'localhost',
    user: 'kdh_2023605',
    password: 'kdh_2023605',
    database: 'kdh_2023605'
});

db.connect((err) => {
    if (err) {
        console.error('MySQL 연결 실패:', err.message);
        process.exit(1);
    }
    console.log('MySQL에 성공적으로 연결되었습니다.');
});

// 세션 저장소 설정
const sessionStore = new MySQLStore({}, db);
app.use(session({
    key: 'user_sid',
    secret: process.env.SESSION_SECRET || 'your-secret',
    store: sessionStore,
    resave: false,
    saveUninitialized: false
}));

// 미들웨어 설정
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// 템플릿 엔진 설정 (nunjucks 사용)
nunjucks.configure(path.join(__dirname, 'views'), {
    autoescape: true,
    express: app
});

// 유틸 함수: 인증 확인 미들웨어
function isAuthenticated(req, res, next) {
    if (req.session.username) {
        return next();
    }
    res.redirect('/login');
}

// 라우팅
// 홈 페이지
// 홈 라우트
app.get('/', (req, res) => {
    res.render('home.html', {username: req.session.username});
});

// 로그인 페이지
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// 세션 값 전송 API
app.get('/api/session', (req, res) => {
    res.json({ username: req.session.username || null });
});

const util = require('util');
const query = util.promisify(db.query).bind(db);

// 로그인 처리
app.post('/login/check', async (req, res) => {
    try {
        const { username, password } = req.body;
        const results = await query('SELECT * FROM member WHERE username = ?', [username]);

        if (results.length === 0 || !(await bcrypt.compare(password, results[0].password))) {
            return res.status(401).send('유효하지 않은 사용자명 또는 비밀번호');
        }

        req.session.username = username;
        res.redirect('/');
    } catch (err) {
        console.error(err);
        res.status(500).send('서버 에러');
    }
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

// 회원가입 처리
app.post('/signup/insert', async (req, res) => {
    const { username, password, email, phone, birthdate, age, gender, interests, health_conditions } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    db.query('INSERT INTO member (username, password, email, phone, birthdate, age, gender, interests, health_conditions) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [username, hashedPassword, email, phone, birthdate, age, gender, interests, health_conditions],
        (err) => {
            if (err) {
                console.error(err);
                return res.status(500).send('회원가입 중 오류 발생');
            }
            res.redirect('/');
        });
});

// 유저 프로필 페이지
app.get('/user/:id', isAuthenticated, (req, res) => {
    const userId = req.params.id;
    db.query('SELECT * FROM users WHERE id = ?', [userId], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).send('프로필 조회 실패');
        }
        if (results.length === 0) {
            return res.status(404).send('유저를 찾을 수 없습니다.');
        }
        res.render('user-profile', { user: results[0] });
    });
});

// 마이페이지 라우트
app.get('/mypage', isAuthenticated, (req, res) => {
    const username = req.session.username;

    if (!username) {
        return res.status(400).send('잘못된 요청입니다.');
    }

    db.query('SELECT * FROM member WHERE username = ?', [username], (err, results) => {
        if (err) {
            console.error('데이터베이스 오류:', err);
            return res.status(500).send('서버 오류: 데이터를 가져오지 못했습니다.');
        }

        if (results.length === 0) {
            return res.status(404).send('사용자 정보를 찾을 수 없습니다.');
        }

        // HTML 템플릿 렌더링
        res.render('mypage.html', { me: results[0] });
    });
});

// 기타 페이지 라우팅
const pages = ['hobbyRec', 'matching', 'program', 'progApply', 'progInfo', 'chat'];
pages.forEach(page => {
    app.get(`/${page}`, (req, res) => {
        res.sendFile(path.join(__dirname, 'public', `${page}.html`));
    });
});

// 서버 실행
const PORT = process.env.PORT || 15016;
app.listen(PORT, () => {
    console.log(`서버가 http://116.124.191.174:${PORT}에서 실행 중입니다.`);
});
