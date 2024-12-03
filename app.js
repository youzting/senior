

const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const app = express();
const bcrypt = require('bcrypt');
const path = require('path');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
app.use(cors());
app.use(express.json());

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs'); // or 'pug', 'hbs', etc., depending on the engine you want
app.set('views', path.join(__dirname, 'views'));
app.use(bodyParser.json()); //추가

// MySQL 연결 설정
const db = mysql.createConnection({
  host: 'localhost',
  user: 'jjy_2024145',
  password: 'jjy_2024145',
  database: 'jjy_2024145'
});

db.connect((err) => {
  if (err) {
    console.error('MySQL 연결 실패: ' + err.stack);
    return;
  }
  console.log('MySQL에 연결됨');
});

// 세션 설정
const sessionStore = new MySQLStore({}, db);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
  key: 'user_sid',
  secret: 'your_secret_key', 
  store: sessionStore,
  resave: false,
  saveUninitialized: false,
  cookie: { expires: 1000 * 60 * 60 * 24 }
}));

// 로그인 처리
app.post('/login', (req, res) => {
  const { user_id, password } = req.body;
  const query = 'SELECT * FROM users WHERE user_id = ?';
  
  db.query(query, [user_id], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).send('로그인 처리 중 오류가 발생했습니다.');
    }
    if (result.length === 0) {
      return res.status(401).send('아이디가 존재하지 않습니다.');
    }

    bcrypt.compare(password, result[0].password, (err, isMatch) => {
      if (err) {
        console.error(err);
        return res.status(500).send('비밀번호 비교 중 오류가 발생했습니다.');
      }
      if (isMatch) {
        req.session.user_id = user_id;  // 세션에 user_id 저장
        return res.redirect("/home2");  // 홈 화면으로 리디렉션
      } else {
        return res.status(401).send('비밀번호가 틀렸습니다.');
      }
    });
  });
});


// 로그아웃 처리
app.get('/logout', function(req, res) {
  req.session.destroy(function(err) {
    if (err) {
      return res.status(500).send('로그아웃 중 오류가 발생했습니다.');
    }
    res.redirect('/login');  // 로그인 페이지로 리디렉션
  });
});


// 회원가입 API
app.post('/register', async (req, res) => {
  const { user_id, name, email, password } = req.body;

  const checkQuery = 'SELECT * FROM users WHERE user_id = ? OR email = ?';
  db.query(checkQuery, [user_id, email], async (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).send('중복 확인에 실패했습니다.');
    }
    if (result.length > 0) {
      return res.status(400).send('아이디 또는 이메일이 중복되었습니다.');
    }

    // 비밀번호 암호화
    try {
      const hashedPassword = await bcrypt.hash(password, 10);  // async/await 사용

      const query = 'INSERT INTO users (user_id, name, email, password) VALUES (?, ?, ?, ?)';
      db.query(query, [user_id, name, email, hashedPassword], (err, result) => {
        if (err) {
          console.error(err);
          return res.status(500).send('등록에 실패했습니다.');
        }
        res.status(200).send('회원가입 성공');
      });
    } catch (err) {
      console.error(err);
      res.status(500).send('비밀번호 암호화에 실패했습니다.');
    }
  });
});


// QAController의 /support/post POST 라우트
app.post('/support/post', (req, res) => {
    const { category, title, contents } = req.body;
    //const id = req.session?.id || '비로그인';
    const id = 'dbgys1234';
    const answered = 0;
    const answer = "(답변준비중)";
    const qdate = new Date();
  
    const insertQuery = `
      INSERT INTO qa (id, category, title, contents, answered, answer)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    db.query(insertQuery, [id, category, title, contents, answered, answer], (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).send('등록에 실패했습니다.');
      }
      res.redirect('/support/postlist');
    });
  });
  
// QAController의 /support/postlist GET 라우트
app.get('/support/postlist', (req, res) => {
    const selectQuery = 'SELECT * FROM qa';
    db.query(selectQuery, (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).send('목록 불러오기 실패');
      }
      res.render('support_postlist', { qaList: result });
    });
  });
  
  // QAController의 /support/detail/:no GET 라우트
  app.get('/support/detail/:no', (req, res) => {
    const { no } = req.params;
    const detailQuery = 'SELECT * FROM qa WHERE no = ?';
    db.query(detailQuery, [no], (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).send('세부 정보 불러오기 실패');
      }
      res.render('support_detail', { qa: result[0] });
    });
  });

app.get('/mypage', (req, res) => {
  const user_id = req.session.user_id; // 세션에서 user_id 가져오기

  if (!user_id) {
    return res.redirect('/login');  // 로그인되지 않은 경우 로그인 페이지로 리다이렉트
  }

  db.query('SELECT * FROM users WHERE user_id = ?', [user_id], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).send('사용자 정보 조회 중 오류가 발생했습니다.');
    }

    if (results.length > 0) {
      // `me` 객체를 EJS 템플릿에 전달
      res.render('mypage', { me: results[0] });
    } else {
      res.redirect('/login');  // 사용자 정보가 없으면 로그인 페이지로 리디렉트
    }
  });
});


// /mypage/update 라우트
app.get('/mypage/update', (req, res) => {
    const { name, user_id, password, email } = req.query;

    db.query('UPDATE users SET name = ?, password = ?, email = ? WHERE user_id = ?', 
        [name, password, email, user_id], (err, results) => {
        if (err) throw err;

        res.redirect('/mypage');
    });
});

// 커뮤니티 게시물 목록 조회 (GET 요청)
app.get('/api/comu', async (req, res) => {
  const { category } = req.query; // URL 쿼리에서 category 값 가져오기

  try {
    // category 값이 있는 경우와 없는 경우에 따라 다른 쿼리 실행
    const query = category
      ? 'SELECT post_id, category, titlename, mem_id FROM sw WHERE category = ?'
      : 'SELECT post_id, category, titlename, mem_id FROM sw';

    const [posts] = await db.promise().query(query, category ? [category] : []);
    res.json(posts); // JSON 형식으로 게시물 목록 반환
  } catch (error) {
    console.error('데이터 조회 중 오류:', error);
    res.status(500).json({ message: '데이터 조회에 실패했습니다.' });
  }
});





// 글쓰기 페이지 접근 (로그인 확인 및 카테고리 목록 제공)
app.get('/api/write', async (req, res) => {
  const sessionId = req.session.user_id;
  if (!sessionId) {
    return res.status(401).json({ message: '로그인이 필요합니다.' });
  }
  try {
    const [categories] = await db.promise().query('SELECT DISTINCT category FROM sw');
    res.json(categories.map(row => row.category));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '카테고리 조회에 실패했습니다.' });
  }
});

// 게시물 작성
app.post('/api/write', async (req, res) => {
  const { category, titlename, contents } = req.body;
  const mem_id = req.session?.user_id || null; // 로그인되지 않은 경우 null 설정

  // 필수 데이터 확인
  if (!category || !titlename || !contents) {
    return res.status(400).json({ message: '모든 필드를 입력해 주세요.' });
  }
  try {
    // 데이터베이스에 INSERT
    const query = 'INSERT INTO sw (category, titlename, contents, mem_id) VALUES (?, ?, ?, ?)';
    db.query(query, [category, titlename, contents, mem_id], (err, result) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ message: '저장에 실패했습니다.' });
      }
      console.log('글 작성 성공:', result);
      res.status(201).json({ message: '글 작성이 완료되었습니다.' });
    });
  } catch (error) {
    console.error('저장 중 오류 발생:', error);
    res.status(500).json({ message: '저장에 실패했습니다.' });
  }
});
app.get('/api/comments/:postId', async (req, res) => {
  const { postId } = req.params;
  try {
    const [comments] = await db.promise().query(
      'SELECT * FROM comments WHERE post_id = ? ORDER BY created_at DESC',
      [postId]
    );
    res.json(comments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '댓글 목록을 불러올 수 없습니다.' });
  }
});

app.post('/api/comments/:postId', async (req, res) => {
  const { postId } = req.params;
  const { text } = req.body;
  const username = req.session?.user_id || '익명';
  if (!text) {
    return res.status(400).json({ message: '댓글 내용을 입력해주세요.' });
  }
  try {
    const query = 'INSERT INTO comments (post_id, username, text) VALUES (?, ?, ?)';
    await db.promise().query(query, [postId, username, text]);
    res.status(201).json({ message: '댓글이 작성되었습니다.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '댓글 작성에 실패했습니다.' });
  }
});

// 고유 카테고리 목록 가져오기
app.get('/api/categories', async (req, res) => {
  try {
    const [categories] = await db.promise().query('SELECT DISTINCT category FROM sw');
    res.json(categories.map(row => row.category));
  } catch (error) {
    console.error('카테고리 목록을 불러오는 중 오류:', error);
    res.status(500).json({ message: '카테고리 목록을 가져오는 데 실패했습니다.' });
  }
});

app.get('/api/posts', async (req, res) => {
  const { category } = req.query;
  try {
    const [posts] = await db.promise().query('SELECT * FROM sw WHERE category = ?', [category]);
    res.json(posts);
  } catch (error) {
    console.error('게시글 목록을 불러오는 중 오류:', error);
    res.status(500).json({ message: '게시글 목록을 가져오는 데 실패했습니다.' });
  }
});

app.get('/api/category-counts', async (req, res) => {
  try {
    const [categories] = await db.promise().query(
      'SELECT category, COUNT(*) AS post_count FROM sw GROUP BY category'
    );
    res.json(categories); // category와 post_count 포함 데이터 반환
  } catch (error) {
    console.error('카테고리 목록 및 게시글 수를 불러오는 중 오류:', error);
    res.status(500).json({ message: '카테고리 데이터를 가져오는 데 실패했습니다.' });
  }
});


// 알림 메시지와 리다이렉트 URL을 전달하는 팝업 경로
app.get('/api/popup', (req, res) => {
  const msg = req.query.msg || '안내 메시지입니다.';
  const url = req.query.url || '/';
  res.send(`
    <script>
      alert('${msg}');
      location.href = '${url}';
    </script>
  `);
});

// 특정 게시글을 post_id로 조회하는 API 엔드포인트
app.get('/api/post/:post_id', async (req, res) => {
  const postId = req.params.post_id;

  try {
    const [rows] = await db.promise().query('SELECT * FROM sw WHERE post_id = ?', [postId]);

    if (rows.length === 0) {
      return res.status(404).json({ message: '게시글을 찾을 수 없습니다.' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '게시글 조회에 실패했습니다.' });
  }
});

// 볼링장 목록 API
app.get('/api/bowling_list', (req, res) => {
  const query = 'SELECT id, name, address, score, img1 FROM bowling_list';
  db.query(query, (err, results) => {
    if (err) {
      console.error('볼링장 데이터 조회 실패:', err);
      return res.status(500).json({ message: '볼링장 데이터를 불러올 수 없습니다.' });
    }
    res.json(results); // JSON 형식으로 결과 반환
  });
});

//볼링장 페이지 API
app.get('/api/bowling_list/:pid', (req, res) => {
  const pid = parseInt(req.params.pid, 10); // pid를 정수로 변환
  if (isNaN(pid)) {
    return res.status(400).json({ message: '잘못된 pid 값입니다.' });
  }

  const query = 'SELECT * FROM bowling_list WHERE id = ?'; // 특정 id의 데이터를 조회
  db.query(query, [pid], (err, results) => {
    if (err) {
      console.error('볼링장 데이터 조회 실패:', err);
      return res.status(500).json({ message: '볼링장 데이터를 불러올 수 없습니다.' });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: '해당 pid에 대한 데이터가 존재하지 않습니다.' });
    }

    res.json(results[0]); // 단일 객체를 반환
  });
});

// 댓글 조회 라우트
app.get('/api/bowling_comments/:postId', async (req, res) => {
  const { postId } = req.params;

  try {
    const [comments] = await db.promise().query(
      'SELECT * FROM bowling_comments WHERE post_id = ? ORDER BY created_at DESC',
      [postId]
    );

    if (comments.length === 0) {
      return res.status(404).json({ message: '댓글이 없습니다.' });
    }

    res.json(comments); // 댓글 목록 반환
  } catch (error) {
    console.error('댓글 조회 중 오류:', error);
    res.status(500).json({ message: '댓글 목록을 불러올 수 없습니다.' });
  }
});
// 댓글 작성 라우트
app.post('/api/bowling_comments/:postId', async (req, res) => {
  const { postId } = req.params;
  const { text } = req.body;
  const username = req.session?.user_id || '익명'; // 로그인 여부에 따라 username 설정

  if (!text) {
    return res.status(400).json({ message: '댓글 내용을 입력하세요.' });
  }

  try {
    const query = 'INSERT INTO bowling_comments (post_id, username, text, created_at) VALUES (?, ?, ?, NOW())';
    const [result] = await db.promise().query(query, [postId, username, text]);

    if (result.affectedRows === 1) {
      res.status(201).json({ message: '댓글이 작성되었습니다.' });
    } else {
      throw new Error('댓글 작성 실패');
    }
  } catch (error) {
    console.error('댓글 작성 중 오류:', error);
    res.status(500).json({ message: '댓글 작성에 실패했습니다.' });
  }
});


// 제과제빵 목록 API
app.get('/api/baking_list', (req, res) => {
  const query = 'SELECT * FROM baking_list';
  db.query(query, (err, results) => {
    if (err) {
      console.error('제과제빵 데이터 조회 실패:', err);
      return res.status(500).json({ message: '제과제빵 데이터를 불러올 수 없습니다.' });
    }
    res.json(results); // JSON 형식으로 결과 반환
  });
});

app.get('/book/:placeName', (req, res) => {
  const { placeName } = req.params; // 동적 경로에서 장소 이름 추출
  res.sendFile(path.join(__dirname, 'book.html'));
});

// 예약 데이터 저장 API
app.post('/api/book', (req, res) => {
  const { id, date, peopleCount, time, phonenum, place } = req.body;

  if (!id || !date || !peopleCount || !time || !phonenum || !place) {
    return res.status(400).json({ success: false, message: '모든 필드를 입력해주세요.' });
  }

  const query = `
    INSERT INTO booking (id, date, people_count, time, phonenum, place)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  db.query(query, [id, date, peopleCount, time, phonenum, place], (err, result) => {
    if (err) {
      console.error('예약 저장 중 오류:', err);
      return res.status(500).json({ success: false, message: '예약 저장에 실패했습니다.' });
    }

    res.status(201).json({ success: true, message: '예약이 완료되었습니다.' });
  });
});


// 서버 실행
app.listen(15014, '0.0.0.0', () => {  // 모든 네트워크 인터페이스에서 포트 열기
  console.log('서버가 0.0.0.0:15014 포트에서 실행 중...');
});

//서버 연결

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'home.html')); //홈
});

app.get('/home', (req, res) => {
  res.sendFile(path.join(__dirname, 'home.html')); //홈
});

app.get('/logup', (req, res) => {
  res.sendFile(path.join(__dirname, 'logup.html'));  //회원가입
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'login.html'));  //로그인
});

app.get('/mypage', (req, res) => {
  res.sendFile(path.join(__dirname, 'mypage.html')); //홈
});

app.get('/comu', (req, res) => {
  res.sendFile(path.join(__dirname, 'comu.html'));
});

app.get('/write', (req, res) => {
  res.sendFile(path.join(__dirname, 'write.html'));
});

app.get('/popup', (req, res) => {
  res.sendFile(path.join(__dirname, 'popup.html'));
});

app.get('/content', (req, res) => {
  res.sendFile(path.join(__dirname, 'content.html'));
});

app.get('/categories', (req, res) => {
  res.sendFile(path.join(__dirname, 'categories.html'));
});

app.get('/event', (req, res) => {
  res.sendFile(path.join(__dirname, 'event.html'));  //고객센터
});

app.get('/home2', (req, res) => {
  res.sendFile(path.join(__dirname, 'home2.html'));  //로그인
});

app.get('/support', (req, res) => {
  res.sendFile(path.join(__dirname, 'support.html'));  //고객센터
});

app.get('/support/faq1', (req, res) => {
  res.sendFile(path.join(__dirname, 'support_faq1.html'));  //고객센터
});

app.get('/support/faq2', (req, res) => {
  res.sendFile(path.join(__dirname, 'support_faq2.html'));  //고객센터
});

app.get('/support/faq3', (req, res) => {
  res.sendFile(path.join(__dirname, 'support_faq3.html'));  //고객센터
});

app.get('/support/faq4', (req, res) => {
  res.sendFile(path.join(__dirname, 'support_faq4.html'));  //고객센터
});

app.get('/support/post', (req, res) => {
  res.sendFile(path.join(__dirname, 'support_post.html'));  //고객센터
});

app.get('/booking', (req, res) => {
  res.sendFile(path.join(__dirname, 'booking.html'));  //예약하기-카테고리
});

app.get('/booking/bowling', (req, res) => {
  res.sendFile(path.join(__dirname, 'bowling.html')); // 새로운 경로로 파일 반환
});

app.get('/booking/bowling/:pid', (req, res) => {
  res.sendFile(path.join(__dirname, 'bowling_page.html'));  //예약하기-카테고리
});

app.get('/book/:placeName', (req, res) => {
  const { placeName } = req.params; // 동적 경로에서 장소 이름 추출
  res.sendFile(path.join(__dirname, 'book.html')); // 공통 예약 페이지 반환
});

app.get('/study', (req, res) => {
  res.sendFile(path.join(__dirname, 'study.html'));  //동영상 강의- 카테고리
});

app.get('/study/baking', (req, res) => {
  res.sendFile(path.join(__dirname, 'baking.html')); // 새로운 경로로 파일 반환
});

app.get('/study/baking/:pid', (req, res) => {
  res.sendFile(path.join(__dirname, 'baking_page.html'));  //동영상 강의- 카테고리
});
