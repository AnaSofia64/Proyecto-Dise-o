package com.parkflow.repository.jpa;
import com.parkflow.entity.UserPlateEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
public interface UserPlateJpaRepository extends JpaRepository<UserPlateEntity, String> {
    List<UserPlateEntity> findByUserId(String userId);
    boolean existsByUserIdAndPlate(String userId, String plate);
    void deleteByUserIdAndPlate(String userId, String plate);
    boolean existsByPlate(String plate);
    Optional<UserPlateEntity> findByPlate(String plate);
}