import com.sun.net.httpserver.HttpServer;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpExchange;
import java.io.IOException;
import java.io.OutputStream;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.nio.file.Path;
import java.net.InetSocketAddress;
import java.io.InputStream;
import java.util.HashMap;
import java.util.Map;

public class Server {

    public static void main(String[] args) throws Exception {
        HttpServer server = HttpServer.create(new InetSocketAddress("0.0.0.0", 15016), 0);

        // 경로별 핸들러 설정
        Map<String, HttpHandler> handlers = new HashMap<>();

        // /home 경로 핸들러 (홈 화면)
        handlers.put("/home", exchange -> servePage(exchange, "home.html"));

        // /login 경로 핸들러
        handlers.put("/login", exchange -> servePage(exchange, "login.html"));

        // /signup 경로 핸들러
        handlers.put("/signup", exchange -> servePage(exchange, "signup.html"));

        // /mypage 경로 핸들러
        handlers.put("/mypage", exchange -> servePage(exchange, "mypage.html"));

        // 추가된 페이지 핸들러
        handlers.put("/chat", exchange -> servePage(exchange, "chat.html"));
        handlers.put("/hobbyRec", exchange -> servePage(exchange, "hobbyRec.html"));
        handlers.put("/matching", exchange -> servePage(exchange, "matching.html"));
        handlers.put("/popup", exchange -> servePopupPage(exchange)); // 팝업 페이지 핸들러
        handlers.put("/progApply", exchange -> servePage(exchange, "progApply.html"));
        handlers.put("/program", exchange -> servePage(exchange, "program.html"));
        handlers.put("/proginfo", exchange -> servePage(exchange, "proginfo.html"));
        handlers.put("/user", exchange -> servePage(exchange, "user.html"));

        // POST 요청 핸들러 추가
        handlers.put("/signup/insert", exchange -> handleSignup(exchange));
        handlers.put("/login/check", exchange -> handleLogin(exchange));

        // 핸들러 추가
        for (Map.Entry<String, HttpHandler> entry : handlers.entrySet()) {
            server.createContext(entry.getKey(), entry.getValue());
        }

        // 서버 시작
        server.start();
        System.out.println("서버가 0.0.0.0:15016에서 시작되었습니다.");
    }

    // HTML 파일을 서빙하는 메서드
    private static void servePage(HttpExchange exchange, String filename) throws IOException {
        Path path = Paths.get(filename);
        if (Files.exists(path)) {
            byte[] response = Files.readAllBytes(path);
            exchange.sendResponseHeaders(200, response.length);
            OutputStream os = exchange.getResponseBody();
            os.write(response);
            os.close();
        } else {
            String response = "<html><body><h1>파일을 찾을 수 없습니다.</h1></body></html>";
            exchange.sendResponseHeaders(404, response.length());
            OutputStream os = exchange.getResponseBody();
            os.write(response.getBytes());
            os.close();
        }
    }

    // 팝업 페이지를 서빙하는 메서드
    private static void servePopupPage(HttpExchange exchange) throws IOException {
        String query = exchange.getRequestURI().getQuery();
        Map<String, String> queryParams = queryToMap(query);

        String msg = queryParams.get("msg");
        String url = queryParams.get("url");

        String responseMessage = "<html><body>";
        responseMessage += "<h1>" + msg + "</h1>";
        responseMessage += "<a href='" + url + "'>이동하기</a>";
        responseMessage += "</body></html>";

        exchange.sendResponseHeaders(200, responseMessage.length());
        OutputStream os = exchange.getResponseBody();
        os.write(responseMessage.getBytes());
        os.close();
    }

    // 회원가입 처리 후 팝업 페이지로 리다이렉트
    private static void handleSignup(HttpExchange exchange) throws IOException {
        // POST 요청 바디 읽기
        String responseMessage = "<html><body>";
        InputStream inputStream = exchange.getRequestBody();
        String body = new String(inputStream.readAllBytes());

        // 간단한 아이디 중복 체크 시나리오 (예: username=test)
        if (body.contains("username=test")) {
            // 회원가입 실패 메시지, 팝업 페이지로 리다이렉션
            responseMessage += "<h1>아이디가 중복됩니다. 다시 시도해주세요.</h1>";
            responseMessage += "<a href='/signup'>돌아가기</a>";
        } else {
            // 회원가입 성공 후 팝업 페이지로 리다이렉션
            String redirectUrl = "/popup?msg=회원가입%20성공&url=/login";
            exchange.getResponseHeaders().set("Location", redirectUrl);
            exchange.sendResponseHeaders(302, -1);  // 302 리다이렉션 상태 코드
            return;
        }
        responseMessage += "</body></html>";

        exchange.sendResponseHeaders(200, responseMessage.length());
        OutputStream os = exchange.getResponseBody();
        os.write(responseMessage.getBytes());
        os.close();
    }

    // 로그인 체크 후 팝업 페이지로 리다이렉트
    private static void handleLogin(HttpExchange exchange) throws IOException {
        String responseMessage = "<html><body>";
        InputStream inputStream = exchange.getRequestBody();
        String body = new String(inputStream.readAllBytes());

        // 간단한 로그인 체크 (예: username=test, password=test)
        if (body.contains("username=test") && body.contains("password=test")) {
            // 로그인 성공 후 팝업 페이지로 리다이렉션
            String redirectUrl = "/popup?msg=로그인%20성공&url=/home";
            exchange.getResponseHeaders().set("Location", redirectUrl);
            exchange.sendResponseHeaders(302, -1);  // 302 리다이렉션 상태 코드
            return;
        } else {
            responseMessage += "<h1>아이디 또는 비밀번호가 틀렸습니다. 다시 시도해주세요.</h1>";
            responseMessage += "<a href='/login'>돌아가기</a>";
        }

        responseMessage += "</body></html>";

        exchange.sendResponseHeaders(200, responseMessage.length());
        OutputStream os = exchange.getResponseBody();
        os.write(responseMessage.getBytes());
        os.close();
    }

    // 쿼리 파라미터를 맵으로 변환하는 메서드
    private static Map<String, String> queryToMap(String query) {
        Map<String, String> map = new HashMap<>();
        String[] pairs = query.split("&");
        for (String pair : pairs) {
            String[] keyValue = pair.split("=");
            if (keyValue.length == 2) {
                map.put(keyValue[0], keyValue[1]);
            }
        }
        return map;
    }
}
