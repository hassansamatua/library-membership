<?php
// Update existing profile for user 25 (Jafar Juma Jafar)
$host = 'localhost';
$dbname = 'next_auth';
$username = 'root';
$password = '';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "Checking existing profile for user 25...\n";
    
    // First, check what's currently there
    $stmt = $pdo->prepare('SELECT * FROM user_profiles WHERE user_id = 25');
    $stmt->execute();
    $existing = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($existing) {
        echo "Found existing profile for user 25. Updating it...\n";
        
        echo "Current data:\n";
        echo "Phone: " . ($existing['phone'] ?? 'NULL') . "\n";
        echo "Address: " . ($existing['address'] ?? 'NULL') . "\n";
        echo "City: " . ($existing['city'] ?? 'NULL') . "\n";
        echo "Gender: " . ($existing['gender'] ?? 'NULL') . "\n";
        echo "Nationality: " . ($existing['nationality'] ?? 'NULL') . "\n";
        echo "Job Title: " . ($existing['job_title'] ?? 'NULL') . "\n";
        echo "Company: " . ($existing['company'] ?? 'NULL') . "\n";
        echo "Highest Degree: " . ($existing['highest_degree'] ?? 'NULL') . "\n";
        echo "Institution: " . ($existing['institution'] ?? 'NULL') . "\n";
        echo "\n";
        
        // Update the existing record with meaningful data
        $stmt = $pdo->prepare('
            UPDATE user_profiles SET 
                phone = ?, 
                address = ?, 
                city = ?, 
                state = ?, 
                postal_code = ?, 
                country = ?,
                job_title = ?,
                company = ?,
                industry = ?,
                years_of_experience = ?,
                skills = ?,
                highest_degree = ?,
                institution = ?,
                field_of_study = ?,
                year_of_graduation = ?,
                additional_certifications = ?,
                date_of_birth = ?,
                gender = ?,
                nationality = ?,
                place_of_birth = ?,
                personal_info = ?,
                contact_info = ?,
                education = ?,
                employment = ?,
                updated_at = NOW()
            WHERE user_id = 25
        ');
        
        $personalInfo = json_encode([
            'fullName' => 'Jafar Juma Jafar',
            'name' => 'Jafar Juma Jafar',
            'gender' => 'male',
            'dateOfBirth' => '1990-01-01',
            'nationality' => 'Tanzanian'
        ]);
        
        $contactInfo = json_encode([
            'phone' => '0626776318',
            'address' => '123 Library Street',
            'city' => 'Dar es Salaam',
            'country' => 'Tanzania'
        ]);
        
        $education = json_encode([
            [
                'highestDegree' => 'Bachelor of Library Science',
                'institution' => 'University of Dar es Salaam',
                'fieldOfStudy' => 'Library and Information Science',
                'yearOfGraduation' => '2018'
            ]
        ]);
        
        $employment = json_encode([
            [
                'jobTitle' => 'Librarian',
                'company' => 'National Library of Tanzania',
                'industry' => 'Education & Information Services',
                'yearsOfExperience' => '5'
            ]
        ]);
        
        $result = $stmt->execute([
            '0626776318',                          // phone
            '123 Library Street',                     // address
            'Dar es Salaam',                       // city
            'Dar es Salaam',                       // state
            '12345',                               // postal_code
            'Tanzania',                            // country
            'Librarian',                           // job_title
            'National Library of Tanzania',          // company
            'Education & Information Services',       // industry
            5,                                     // years_of_experience
            'Cataloging, Research, Digital Archives', // skills
            'Bachelor of Library Science',         // highest_degree
            'University of Dar es Salaam',        // institution
            'Library and Information Science',      // field_of_study
            2018,                                  // year_of_graduation
            'Professional Librarian Certification', // additional_certifications
            '1990-01-01',                         // date_of_birth
            'male',                                // gender
            'Tanzanian',                           // nationality
            'Dar es Salaam',                       // place_of_birth
            $personalInfo,                          // personal_info
            $contactInfo,                          // contact_info
            $education,                             // education
            $employment,                            // employment
        ]);
        
        if ($result) {
            echo "✓ Profile updated successfully for user 25!\n";
            
            // Verify the updated profile
            $stmt = $pdo->prepare('SELECT * FROM user_profiles WHERE user_id = 25');
            $stmt->execute();
            $profile = $stmt->fetch(PDO::FETCH_ASSOC);
            
            echo "\nUpdated profile data:\n";
            echo "====================\n";
            echo "User ID: " . $profile['user_id'] . "\n";
            echo "Phone: " . $profile['phone'] . "\n";
            echo "Address: " . $profile['address'] . "\n";
            echo "City: " . $profile['city'] . "\n";
            echo "Country: " . $profile['country'] . "\n";
            echo "Gender: " . $profile['gender'] . "\n";
            echo "Nationality: " . $profile['nationality'] . "\n";
            echo "Job Title: " . $profile['job_title'] . "\n";
            echo "Company: " . $profile['company'] . "\n";
            echo "Industry: " . $profile['industry'] . "\n";
            echo "Highest Degree: " . $profile['highest_degree'] . "\n";
            echo "Institution: " . $profile['institution'] . "\n";
            echo "Field of Study: " . $profile['field_of_study'] . "\n";
            echo "Year of Graduation: " . $profile['year_of_graduation'] . "\n";
            echo "Skills: " . $profile['skills'] . "\n";
            
        } else {
            echo "❌ Failed to update profile for user 25\n";
            print_r($stmt->errorInfo());
        }
        
    } else {
        echo "No profile found for user 25. This is unexpected given the duplicate key error.\n";
    }
    
} catch (PDOException $e) {
    echo "❌ Database error: " . $e->getMessage() . "\n";
}
?>
