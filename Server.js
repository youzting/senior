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

// 마이페이지 수정 처리
app.post('/mypage/update', isAuthenticated, (req, res) => {
    const { username, email, phone, birthdate, age, gender, interests, health_conditions } = req.body;
    const usernameFromSession = req.session.username;


    // 세션과 데이터베이스에서 사용자 정보를 업데이트
    if (!usernameFromSession) {
        return res.status(400).send('사용자 정보가 없습니다.');
    }

    const updateQuery = `
        UPDATE member
        SET email = ?, phone = ?, birthdate = ?, age = ?, gender = ?, interests = ?, health_conditions = ?
        WHERE username = ?
    `;

    db.query(updateQuery, [email, phone, birthdate, age, gender, interests, health_conditions, usernameFromSession], (err, results) => {
        if (err) {
            console.error('업데이트 오류:', err);
            return res.status(500).send('서버 오류');
        }
        res.redirect('/mypage');  // 업데이트 후 마이페이지로 리다이렉트
    });
});

app.post('/appform', isAuthenticated, (req, res) => {
    const usernameFromSession = req.session.username;  // 세션에서 username을 가져옴
    const preferredDate = req.body.preferred_date;  // 참여 희망 날짜
    const preferredTime = req.body.preferred_time;  // 참여 희망 시간
    const programName = req.body.program_name;  // 프로그램 이름

    if (!usernameFromSession) {
        return res.status(400).send('로그인된 사용자가 없습니다.');
    }

    if (!programName) {
        return res.status(400).send('프로그램 이름이 제공되지 않았습니다.');
    }

    // 'application_form' 테이블에 username, program_name, preferred_date, preferred_time을 추가
    const query = 'INSERT INTO application_form (username, program_name, preferred_date, preferred_time) VALUES (?, ?, ?, ?)';

    db.query(query, [usernameFromSession, programName, preferredDate, preferredTime], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send('신청서를 저장하는 중 오류가 발생했습니다.');
        }

        res.redirect('/proginfo1');
    });
});

// 기타 페이지 라우팅
const pages = ['hobbyRec', 'matching', 'program', 'progApply', 'progInfo1', 'chat'];
pages.forEach(page => {
    app.get(`/${page}`, (req, res) => {
        res.sendFile(path.join(__dirname, 'public', `${page}.html`));
    });
});

// 취미 추가
app.post('/hobby/update', isAuthenticated, (req, res) => {
    const usernameFromSession = req.session.username;

    // 세션과 데이터베이스에서 사용자 정보를 업데이트
    if (!usernameFromSession) {
        return res.status(400).send('사용자 정보가 없습니다.');
    }

    // 클라이언트에서 전송된 'hobby' 값을 가져옵니다.
    const { hobby } = req.body; // req.body에서 hobby 가져오기
    if (!hobby) {
        return res.status(400).send('취미 정보가 없습니다.');
    }

    const updateQuery = `UPDATE member SET interests = ? WHERE username = ?`;

    db.query(updateQuery, [hobby, usernameFromSession], (err, results) => {
        if (err) {
            console.error('업데이트 오류:', err);
            return res.status(500).send('서버 오류');
        }
        res.redirect('/hobbyRec'); // 업데이트 후 취미 추천으로 리다이렉트
    });
});

// 서버 실행
const PORT = process.env.PORT || 15016;
app.listen(PORT, () => {
    console.log(`서버가 http://116.124.191.174:${PORT}에서 실행 중입니다.`);
});
