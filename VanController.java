import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;
import jakarta.servlet.http.HttpSession;

@Controller
public class VanController {

   @Autowired
   private MemberRepository mrep;

   @GetMapping("/login") // 로그인
   public String login() {
       return "login";
   }

   @GetMapping("/signup") // 회원가입
   public String signup() {
     return "signup";
   }

   @PostMapping("/signup/insert") // 회원가입 세부사항
   public String signupInsert(String username, String password, String email, String phone, String birthdate, String age, String gender, String interests, String health_conditions, RedirectAttributes re) {
     if (mrep.existsById(username)) {
        re.addAttribute("msg", username + "는 이미 사용되고 있는 아이디입니다.");
        re.addAttribute("url", "back");
     } else {
        Member me = new Member();
        me.username = username;
        me.password = password;
        me.email = email;
        me.phone = phone;
        me.birthdate = birthdate;
        me.age = age;
        me.gender = gender;
        me.interests = interests;
        me.health_conditions = health_conditions;
        mrep.save(me);

        re.addAttribute("msg", username + "님, 환영합니다.");
        re.addAttribute("url", "/login");
     }
     return "redirect:/popup";
   }

   @GetMapping("/popup") // 리다이렉션에 필요한 팝업
   public String popup(String msg, String url, Model mo) {
     mo.addAttribute("msg", msg);
     mo.addAttribute("url", url);
     return "popup";
   }

   @PostMapping("/login/check") // 로그인 시 데이터베이스와 대조
   public String loginCheck(HttpSession se, String username, String password, Model mo, RedirectAttributes re) {
     if (mrep.existsById(username)) {
        String storedPassword = mrep.findPasswordById(username);
        if (storedPassword != null && storedPassword.equals(password)) {
            se.setAttribute("username", username);
            return "redirect:/home";
        } else {
            re.addAttribute("msg", "비밀번호가 일치하지 않습니다.");
            re.addAttribute("url", "/login");
            return "redirect:/popup";
        }
     } else {
         re.addAttribute("msg", username + "는 미등록 아이디입니다. 확인 후 로그인 부탁드립니다.");
         re.addAttribute("url", "/login");
         return "redirect:/popup";
     }
   }

   @GetMapping("/home") // 메인화면
   public String home(HttpSession se, Model mo) {
	 mo.addAttribute("username", se.getAttribute("username"));
	 return "home";
   }

   @GetMapping("/mypage") // 마이페이지
   public String mypage(HttpSession se, Model mo) {
     String username = (String) se.getAttribute("username");
     if (username != null) {
         // Optional을 사용하여 존재 여부 확인 후 데이터 처리
         Member me = mrep.findById(username).orElse(null);
         if (me != null) {
             mo.addAttribute("me", me);
         } else {
             mo.addAttribute("msg", "회원 정보를 찾을 수 없습니다.");
             return "popup";
         }
     } else {
         mo.addAttribute("msg", "로그인 후 이용해 주세요.");
         return "popup";
     }
     return "mypage";
   }

   @PostMapping("/mypage/update") // 회원이 정보 변경할 시 필요함
   public String myinfoUpdate(HttpSession se, String password, String email, String phone, String birthdate, String age, String gender, String interests, String health_conditions, RedirectAttributes re) {
     String username = (String) se.getAttribute("username");
     if (username != null) {
         int updatedRows = mrep.updateMember(username, password, email, phone, birthdate, age, gender, interests, health_conditions);
         if (updatedRows == 0) {
             re.addAttribute("msg", "정보 변경 실패. 고객센터로 문의하세요.");
         } else {
             re.addAttribute("msg", username + "님의 정보가 변경되었습니다.");
         }
     } else {
         re.addAttribute("msg", "로그인 후 정보 변경이 가능합니다.");
     }
     re.addAttribute("url", "back");
     return "redirect:/popup";
   }

   @GetMapping("/logout") // 로그아웃
   public String logout(HttpSession se, Model mo, RedirectAttributes re) {
     String username = (String) se.getAttribute("username");
     if (username != null) {
         mo.addAttribute("username", username);
         re.addAttribute("msg", username + "님, 로그아웃되었습니다.");
         se.invalidate();
         re.addAttribute("url", "/home");
     }
     return "redirect:/popup";
   }
}
