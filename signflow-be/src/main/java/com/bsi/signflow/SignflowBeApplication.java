package com.bsi.signflow;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import com.bsi.signflow.entity.User;
import com.bsi.signflow.repository.UserRepository;

@SpringBootApplication
public class SignflowBeApplication {

	public static void main(String[] args) {
		SpringApplication.run(SignflowBeApplication.class, args);
	}

	@Bean
	public CommandLineRunner seedData(UserRepository userRepository) {
		return args -> {
			if (userRepository.count() <= 1) {
				User u2 = new User();
				u2.setName("Ahmad Fauzi");
				u2.setDepartment("IT Infrastructure");
				u2.setEmail("ahmad@bsi.co.id");
				u2.setRole("Maker");
				u2.setStatus("Aktif");
				userRepository.save(u2);

				User u3 = new User();
				u3.setName("Siti Rahmawati");
				u3.setDepartment("IT Operations");
				u3.setEmail("siti@bsi.co.id");
				u3.setRole("Approver");
				u3.setStatus("Aktif");
				userRepository.save(u3);

				User u4 = new User();
				u4.setName("Bambang Sudarmono");
				u4.setDepartment("Technology & Operations");
				u4.setEmail("bambang@bsi.co.id");
				u4.setRole("Approver");
				u4.setStatus("Aktif");
				userRepository.save(u4);
				
				System.out.println("Data user tambahan berhasil di-seed!");
			}
		};
	}
}
