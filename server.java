import com.sun.net.httpserver.HttpServer;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpExchange;
import java.io.IOException;
import java.io.OutputStream;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.nio.file.Path;
import java.net.InetSocketAddress;
import java.util.HashMap;
import java.util.Map;

public class server {

    public static void main(String[] args) throws Exception {
        // 0.0.0.0을 사용하면 외부에서도 접근할 수 있는 IP로 서버를 시작합니다.
        HttpServer server = HttpServer.create(new InetSocketAddress("0.0.0.0", 15016), 0);

        // 경로별 핸들러 매핑
        Map<String, HttpHandler> handlers = new HashMap<>();

        // /home 경로 핸들러 (홈 화면)
        handlers.put("/home", exchange -> servePage(exchange, "home.html"));

        // /login 경로 핸들러
        handlers.put("/login", exchange -> servePage(exchange, "login.html"));

        // /signup 경로 핸들러
        handlers.put("/signup", exchange -> servePage(exchange, "signup.html"));

        // /mypage 경로 핸들러
        handlers.put("/mypage", exchange -> servePage(exchange, "mypage.html"));

        handlers.put("/chat", exchange -> servePage(exchange, "chat.html"));

        handlers.put("/hobbyRec", exchange -> servePage(exchange, "hobbyRec.html"));

        handlers.put("/matching", exchange -> servePage(exchange, "matching.html"));

        handlers.put("/popup", exchange -> servePage(exchange, "popup.html"));

        handlers.put("/progApply", exchange -> servePage(exchange, "progApply.html"));

        handlers.put("/program", exchange -> servePage(exchange, "program.html"));

        handlers.put("/proginfo", exchange -> servePage(exchange, "proginfo.html"));

        handlers.put("/user", exchange -> servePage(exchange, "user.html"));

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
}
