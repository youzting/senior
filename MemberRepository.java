import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import jakarta.transaction.Transactional;

public interface MemberRepository extends JpaRepository<Member, String>{
	@Query("select m.password from Member m where m.username=?1")
	String findPasswordById(String username);
	
	@Transactional
	@Modifying
	@Query("update Member m set m.password=?2, m.email=?3, m.phone=?4, m.birthdate=?5, m.age=?6, m.gender=?7, m.interests=?8, m.health_conditions=?9 where m.username=?1")
	int updateMember(String username, String password, String email, String phone, String birthdate, String age, String gender, String interests, String health_conditions);
}
