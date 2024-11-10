import com.sun.net.httpserver.HttpServer;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpExchange;
import java.io.IOException;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.nio.file.Files;
import java.nio.file.Paths;

public class server {

    public static void main(String[] args) throws IOException {
        // 서버의 IP 주소와 포트 번호
        HttpServer server = HttpServer.create(new InetSocketAddress("0.0.0.0", 15016), 0);

        // 요청을 처리할 핸들러 설정
        server.createContext("/", new HttpHandler() {
            @Override
            public void handle(HttpExchange exchange) throws IOException {
                // 요청된 HTML 파일 경로
                String filePath = "index.html";
                
                // HTML 파일 읽기
                byte[] fileContent = Files.readAllBytes(Paths.get(filePath));
                
                // 응답 헤더 설정
                exchange.getResponseHeaders().set("Content-Type", "text/html");
                exchange.sendResponseHeaders(200, fileContent.length);
                
                // 응답 본문으로 HTML 파일 전송
                OutputStream os = exchange.getResponseBody();
                os.write(fileContent);
                os.close();
            }
        });

        // 서버 시작
        System.out.println("Server started at http://0.0.0.0:15016/");
        server.start();
    }
}
