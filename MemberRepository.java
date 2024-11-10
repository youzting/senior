import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;

public class MemberDAO {

    private static final String DB_URL = "jdbc:mysql://localhost:3306/your_database";
    private static final String DB_USERNAME = "root";
    private static final String DB_PASSWORD = "password";

    public static String findPasswordByUsername(String username) {
        String password = null;
        try (Connection connection = DriverManager.getConnection(DB_URL, DB_USERNAME, DB_PASSWORD)) {
            String sql = "SELECT password FROM Member WHERE username = ?";
            try (PreparedStatement stmt = connection.prepareStatement(sql)) {
                stmt.setString(1, username);
                ResultSet resultSet = stmt.executeQuery();
                if (resultSet.next()) {
                    password = resultSet.getString("password");
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return password;
    }

    public static void updateMember(String username, String password, String email) {
        try (Connection connection = DriverManager.getConnection(DB_URL, DB_USERNAME, DB_PASSWORD)) {
            String sql = "UPDATE Member SET password = ?, email = ? WHERE username = ?";
            try (PreparedStatement stmt = connection.prepareStatement(sql)) {
                stmt.setString(1, password);
                stmt.setString(2, email);
                stmt.setString(3, username);
                stmt.executeUpdate();
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
