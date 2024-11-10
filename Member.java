import jakarta.persistence.Entity;
import jakarta.persistence.Id;

@Entity
public class Member {
    @Id public String username; //아이디
    public String password; //비밀번호
    public String email; //이메일
    public String phone; //전화번호
    public String birthdate; //생년월일
    public String age; //나이
    public String gender; //성별
    public String interests; //취미
    public String health_conditions; //건강상태
}
