require('dotenv').config();
const express = require('express');
const nunjucks = require('nunjucks');
const cors = require('cors');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const session = require('express-session');
const nodemailer = require('nodemailer');
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

let parentAccount = {};
let childAccount = {};

// 난수 코드 생성 함수
function generateRandomCode() {
  return Math.random().toString(36).substr(2, 8); // 알파벳과 숫자로 이루어진 8자리 코드
}

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
app.set('view engine', 'html');
app.set('views', path.join(__dirname, 'views'));

// 유틸 함수: 인증 확인 미들웨어
function isAuthenticated(req, res, next) {
    if (req.session.username) {
        return next();
    }
    res.redirect('/login');
}
function getLinkedAccount(userId) {
  return new Promise((resolve, reject) => {
    // 'userId'가 부모일 경우, 자녀 정보를 조회
    const query = 'SELECT * FROM relationships WHERE parent_id = ? OR child_id = ?';
    db.execute(query, [userId, userId], (err, results) => {
      if (err) {
        return reject(err);  // 오류 발생 시 reject
      }
      resolve(results.length > 0 ? results : []);  // 연동된 계정이 있으면 반환, 없으면 빈 배열 반환
    });
  });
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




// 마이페이지 라우트
app.get('/mypage', isAuthenticated, (req, res) => {
    const id = req.query.id;
    const username = req.session.username;
    
    if (!username) {
        return res.status(400).send('잘못된 요청입니다.');
    }

    db.query('SELECT * FROM member WHERE username = ?', [username], (err, userResults) => {
        if (err) {
            console.error('데이터베이스 오류:', err);
            return res.status(500).send('서버 오류: 사용자 정보를 가져오지 못했습니다.');
        }

        if (userResults.length === 0) {
            return res.status(404).send('사용자를 찾을 수 없습니다.');
        }
  
    
        // 신청 내역 조회
        db.query('SELECT * FROM application_form WHERE username = ?', [username], (err, applicationResults) => {
            if (err) {
                console.error('데이터베이스 오류:', err);
                return res.status(500).send('서버 오류: 신청 내역을 가져오지 못했습니다.');
            }

            const moment = require('moment');
            moment.locale('ko'); // 한국어 로케일 설정

            // 날짜 포맷팅
            const application = applicationResults.map(application => {
                application.formattedDate = moment(application.preferred_date).format('YYYY년 MM월 DD일 dddd');
                application.formattedTime = moment(application.preferred_time, 'HH:mm:ss').format('HH:mm'); // 시간 포맷 (초 제외)
                return application;
            });

            // 'mypage' 템플릿을 렌더링하면서 'formattedDate'를 포함한 'application' 객체를 전달
            res.render('mypage', { 
                me: userResults[0], 
                applications: application   
            });
        }); // 신청 내역 조회 끝
    }); // 사용자 정보 조회 끝
});



// 마이페이지 수정 처리
app.post('/mypage/update', isAuthenticated, (req, res) => {
    const { username, email, phone, birthdate, age, gender, interests, health_conditions } = req.body;
    const usernameFromSession = req.session.username;


    // 세션과 데이터베이스에서 사용자 정보를 업데이트
    if (!usernameFromSession) {
        return res.status(400).send('사용자 정보가 없습니다.');
    }

    // 사용자 정보를 조회하는 쿼리 추가
    db.query('SELECT * FROM member WHERE username = ?', [username], (err, userResults) => {
        if (err) {
            console.error('데이터베이스 오류:', err);
            return res.status(500).send('서버 오류: 사용자 정보를 가져오지 못했습니다.');
        }

        if (userResults.length === 0) {
            return res.status(404).send('사용자를 찾을 수 없습니다.');
        }
        // 사용자 정보를 업데이트하는 SQL 쿼리
const updateQuery = `
  UPDATE member 
  SET email = ?, phone = ?, birthdate = ?, age = ?, gender = ?, interests = ?, health_conditions = ?
  WHERE username = ?`;

    db.query(updateQuery, [email, phone, birthdate, age, gender, interests, health_conditions, usernameFromSession], (err, results) => {
        if (err) {
            console.error('업데이트 오류:', err);
            return res.status(500).send('서버 오류');
        }
        res.redirect('/mypage');  // 업데이트 후 마이페이지로 리다이렉트
        });
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

        res.redirect('/program');
    });
});

// 기타 페이지 라우팅
const pages = ['hobbyRec', 'program', 'progApply', 'progInfo1', 'progInfo2', 'parent', 'child'];
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
    const { interests } = req.body; // req.body에서 hobby 가져오기

    // interests 필드 확인 후 동작
    const selectQuery = `SELECT interests FROM member WHERE username = ?`;

    db.query(selectQuery, [usernameFromSession], (err, results) => {
        if (err) {
            console.error('조회 오류:', err);
            return res.status(500).send('서버 오류');
        }

        const currentInterests = results[0]?.interests || ''; // 기존 interests 값

        let updateQuery, updatedInterests;

        if (!currentInterests) {
            // interests 필드가 비어 있는 경우
            updateQuery = `UPDATE member SET interests = ? WHERE username = ?`;
            updatedInterests = interests; // 새로 추가된 취미
        } else {
            // interests 필드가 비어 있지 않은 경우
            updateQuery = `UPDATE member SET interests = ? WHERE username = ?`;
            updatedInterests = `${currentInterests}, ${interests}`; // 기존 값에 추가
        }

        // interests 필드 업데이트
        db.query(updateQuery, [updatedInterests, usernameFromSession], (err, results) => {
            if (err) {
                console.error('업데이트 오류:', err);
                return res.status(500).send('서버 오류');
            }
            res.redirect('/hobbyRec'); // 성공적으로 업데이트 후 리다이렉트
        });
    });
});

app.get('/matching', (req, res) => {
    const query = 'SELECT username, gender, interests FROM member';

    db.query(query, (err, results) => {
        if (err) {
            console.error('데이터베이스 쿼리 오류:', err);
            return res.status(500).send('서버 오류');
        }

        // Nunjucks로 렌더링
        res.render('matching.html', { users: results, username: req.session.username });
    });
});

app.get('/chat', (req, res) => {
    if (!req.session.username) {
        return res.redirect('/login'); // 로그인이 안 되어 있으면 로그인 페이지로 리다이렉트
    }
    res.render('chat.html', { sender: req.session.username });
});

// 채팅 메시지를 저장할 배열 (실제 애플리케이션에서는 DB에 저장해야 함)
let chatMessages = [];

app.post('/chat/send', isAuthenticated, (req, res) => {
    const { sender, message } = req.body;

    // 데이터가 제대로 전달되었는지 확인
    console.log('받은 데이터:', { sender, message });

    if (!message) {
        return res.status(400).json({ error: '메시지가 비어 있습니다.' });
    }

    // 메시지 객체 만들기
    const chatMessage = {
        sender,
        message,
        timestamp: new Date().toISOString()
    };

    // 메시지를 배열에 저장 (DB에 저장하는 방식으로 변경 가능)
    chatMessages.push(chatMessage);

    // 성공적인 메시지 저장 후 응답
    res.status(200).json({ status: 'success', message: '메시지가 전송되었습니다.' });
});

// 채팅 메시지 불러오기 API
app.get('/messages', (req, res) => {
    // 최근 메시지 10개만 가져오기 (필요에 따라 수정 가능)
    const recentMessages = chatMessages.slice(-20);
    res.json(recentMessages);
});

app.post('/parent', (req, res) => {
  const { email, username } = req.body;
  // 이메일과 아이디가 입력되지 않으면 각각에 대해 다른 에러 메시지 반환
  if (!email && !username) {
    return res.status(400).send('이메일과 아이디를 모두 입력하세요.');
  }

  if (!email) {
    return res.status(400).send('이메일을 입력하세요.');
  }

  if (!username) {
    return res.status(400).send('아이디를 입력하세요.');
  }

   // member 테이블에서 username과 email이 일치하는 레코드를 찾기
  const findMemberQuery = `SELECT * FROM member WHERE email = ? AND username = ?`;
  db.query(findMemberQuery, [email, username], (err, results) => {
    if (err) {
      console.error('쿼리 실행 오류:', err);
      return res.status(500).send('서버 오류임');
    }
      
    if (results.length === 0) {
      return res.status(404).send('입력하신 이메일과 사용자명에 일치하는 회원을 찾을 수 없습니다.');
    }
    // 데이터베이스에 부모 계정 저장
  const insertQuery = `INSERT INTO users (email, role, username) VALUES (?, 'parent', ?)`;
  db.query(insertQuery, [email, username], (err, result) => {
    if (err) {
      console.error('부모 계정 저장 오류:', err);
      return res.status(500).send('서버 오류');
    }
      

    const parentId = result.insertId;
    const code = generateRandomCode();

    // 부모 계정의 코드 이메일 전송
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'seniorhobby12@gmail.com',
        pass: 'vesm decn sspn qqsr',
      }
    });

    const mailOptions = {
      from: 'seniorhobby12@gmail.com',
      to: email,
      subject: '부모 계정 연결 코드',
      text: `자녀 계정과 연결하기 위한 코드: ${code}`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        return res.status(500).send('이메일 발송 실패');
      }

      // 부모 계정 코드 저장
      parentAccount = { id: parentId, email, code };
      res.send('부모 계정이 등록되고, 연결 코드가 이메일로 전송되었습니다.');
    });
  });
});
});


app.post('/child', (req, res) => {
  const { email, username, parentCode } = req.body;

    console.log("받은 이메일:", email);
  console.log("받은 아이디:", username); 

  if (!email || !username || !parentCode) {
    return res.status(400).send('이메일, 자녀 username, 부모 계정 코드를 모두 입력하세요.');
  }

  // 자녀 계정 정보 확인: 이메일과 username을 확인하여 해당 자녀 계정이 있는지 확인
  const findChildQuery = 'SELECT * FROM member WHERE email = ? AND username = ?';
  db.query(findChildQuery, [email, username], (err, childResults) => {
    if (err) {
      console.error('자녀 계정 확인 오류:', err);
      return res.status(500).send('서버 오류');
    }
      console.log(childResults);

    if (childResults.length === 0) {
      return res.status(400).send('입력된 이메일과 username에 해당하는 자녀 계정이 없습니다.');
    }

    const childId = childResults[0].id;

    // 부모 계정 코드 확인: 부모 계정이 존재하는지 확인
    const findParentQuery = 'SELECT * FROM users WHERE role = "parent" AND email = ?';
    db.query(findParentQuery, [parentCode], (err, parentResults) => {
      if (err || parentResults.length === 0) {
        return res.status(400).send('유효하지 않은 부모 계정 코드입니다.');
      }

      const parentId = parentResults[0].id;

      // 부모와 자녀의 관계 저장
      const insertRelationshipQuery = 'INSERT INTO relationships (parent_id, child_id) VALUES (?, ?)';
      db.query(insertRelationshipQuery, [parentId, childId], (err) => {
        if (err) {
          console.error('관계 저장 오류:', err);
          return res.status(500).send('서버 오류');
        }

        res.send('부모와 자녀 관계가 성공적으로 설정되었습니다.');
      });
    });
  });
});




// 게시판 목록 조회
app.get('/posts', (req, res) => {
  db.query('SELECT * FROM posts ORDER BY date DESC', (err, results) => {
    if (err) throw err;
    res.json(results); // 게시글 목록을 JSON 형식으로 응답
  });
});

// 게시글 작성
app.post('/create', (req, res) => {
  const { username, title, content, password } = req.body;
  const date = new Date();
  const saltRounds = 10;

  // 비밀번호 해시화
  bcrypt.hash(password, saltRounds, (err, hashedPassword) => {
    if (err) throw err;

    const query = 'INSERT INTO posts (username, title, content, date, password) VALUES (?, ?, ?, ?, ?)';
    db.query(query, [username, title, content, date, hashedPassword], (err, results) => {
      if (err) throw err;
      res.json({ message: '게시글이 작성되었습니다.' });
    });
  });
});

// 비밀번호 확인
app.post('/posts/:id/verifyPassword', (req, res) => {
  const postId = req.params.id;
  const { password } = req.body;

  const query = 'SELECT password FROM posts WHERE id = ?';
  db.query(query, [postId], (err, results) => {
    if (err) throw err;

    if (results.length === 0) {
      return res.status(404).json({ message: '게시글을 찾을 수 없습니다.' });
    }

    const correctPassword = results[0].password;

    // 비밀번호가 일치하는지 확인
    bcrypt.compare(password, correctPassword, (err, isMatch) => {
      if (err) throw err;

      if (isMatch) {
        return res.json({ success: true });
      } else {
        return res.status(403).json({ success: false, message: '비밀번호가 틀립니다.' });
      }
    });
  });
});

// 게시글 수정
app.put('/update/:id', (req, res) => {
  const postId = req.params.id;
  const { title, content } = req.body;

  // 게시글 조회
  db.query('SELECT * FROM posts WHERE id = ?', [postId], (err, results) => {
    if (err) throw err;

    const post = results[0];
    if (!post) {
      return res.status(404).json({ message: '게시글을 찾을 수 없습니다.' });
    }

    // 게시글 수정 쿼리 (작성자 이름은 수정하지 않음)
    const query = 'UPDATE posts SET title = ?, content = ? WHERE id = ?';
    db.query(query, [title, content, postId], (err, results) => {
      if (err) {
        console.error('게시글 수정 중 오류 발생:', err);
        return res.status(500).json({ message: '게시글 수정 중 오류가 발생했습니다.' });
      }
      res.json({ message: '게시글이 수정되었습니다.' });
    });
  });
});

// 댓글 작성
app.post('/comments/:postId', (req, res) => {
  const postId = req.params.postId;
  const { username, content } = req.body;

  const query = 'INSERT INTO comments (post_id, username, content) VALUES (?, ?, ?)';
  db.query(query, [postId, username, content], (err, results) => {
    if (err) throw err;
    res.json({ message: '댓글이 작성되었습니다.' });
  });
});

// 댓글 조회
app.get('/comments/:postId', (req, res) => {
  const postId = req.params.postId;

  const query = 'SELECT * FROM comments WHERE post_id = ? ORDER BY date DESC';
  db.query(query, [postId], (err, results) => {
    if (err) throw err;
    res.json(results); // 댓글 목록을 JSON 형식으로 응답
  });
});

// 게시글 상세 조회
app.get('/posts/:id', (req, res) => {
  const postId = req.params.id;

  db.query('SELECT * FROM posts WHERE id = ?', [postId], (err, result) => {
    if (err) {
      return res.status(500).send('Database error');
    }
    if (result.length === 0) {
      return res.status(404).send('Post not found');
    }
    res.json(result[0]);
  });
});

app.get('/progress', (req, res) => {
    res.sendFile(path.join(__dirname, 'views/progress.html')); // progress.html 파일 경로 지정
});

// 서버 실행
const PORT = process.env.PORT || 15016;
app.listen(PORT, () => {
    console.log(`서버가 http://116.124.191.174:${PORT}에서 실행 중입니다.`);
});
