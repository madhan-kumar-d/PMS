
CREATE TYPE user_role AS ENUM('supeAdmin', 'admin', 'doctor', 'patient');
CREATE TABLE users (
	id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	name VARCHAR(100) NOT NULL,
	email VARCHAR(255) NOT NULL UNIQUE,
	phone_no VARCHAR(20) NOT NULL UNIQUE,
	role user_role default 'patient',
	is_active BOOLEAN NOT NULL DEFAULT FALSE,
	createdAt TIMESTAMP DEFAULT NOW(),
	createdBy INT REFERENCES users(id) NOT NULL,
	modifiedAt TIMESTAMP DEFAULT NOW(),
	modifiedBy INT REFERENCES users(id) NULL
);

CREATE TABLE refresh_token (
	id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	user_id INT NOT NULL REFERENCES users(id),
	token_hash TEXT NOT NULL UNIQUE,
	expires_at TIMESTAMP NOT NULL,
	usered_at TIMESTAMP DEFAULT NULL,
	created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TYPE gender_type AS ENUM('M', 'F', 'O', 'PNTS');
CREATE TABLE patients (
	id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	user_id INT NOT NULL REFERENCES users(id),
	first_name VARCHAR(255) NOT NULL,
	last_name VARCHAR(255) NOT NULL,
	dob DATE NOT NULL,
	gender gender_type NOT NULL,
	blood_type VARCHAR(10) NOT NULL,
	allergies TEXT[],
	createdBy INT NOT NULL REFERENCES users(id),
	createdAt TIMESTAMP NOT NULL DEFAULT NOW(),
	updatedBy INT REFERENCES users(id),
	updatedAt TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE specialization (
	id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	code VARCHAR(10) NOT NULL UNIQUE,
	description TEXT
);

CREATE TABLE doctors (
	id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	user_id INT NOT NULL REFERENCES users(id),
	name VARCHAR(255) NOT NULL,
	description TEXT NOT NULL,
	specialization_id INT NOT NULL REFERENCES specialization(id),
	time_for_apmt INT NOT NULL DEFAULT 15,
	fees DECIMAL(10,3),
	createdBy INT NOT NULL REFERENCES users(id),
	createdAt TIMESTAMP NOT NULL DEFAULT NOW(),
	updatedBy INT REFERENCES users(id),
	updatedAt TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TYPE apmt_status AS ENUM('PENDING', 'CONFIRMED', 'COMPLETED', 'NO-SHOW', 'IN-PRGRESS', 'CANCELED', 'RE-SCHEDULED');

CREATE TABLE appointment (
	id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	doctor_id INT NOT NULL REFERENCES doctors(id),
	patient_id INT NOT NULL REFERENCES patients(id),
	apmt_date DATE NOT NULL,
	start_time TIME NOT NULL,
	end_time TIME NOT NULL,
	status apmt_status NOT NULL DEFAULT 'PENDING',
	createdBy INT NOT NULL REFERENCES users(id),
	createdAt TIMESTAMP NOT NULL DEFAULT NOW(),
	updatedBy INT REFERENCES users(id),
	updatedAt TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE TABLE appointment_status (
	id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	apmt_id INT NOT NULL REFERENCES appointment(id),
	status apmt_status NOT NULL DEFAULT 'PENDING',
	description TEXT,
	createdBy INT NOT NULL REFERENCES users(id),
	createdAt TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TYPE doc_type AS ENUM('LAB', 'SCAN', 'PRESCEIPTION');
CREATE TABLE lab_scan (
	id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	apmt_id INT NOT NULL REFERENCES appointment(id),
	document_type doc_type NOT NULL, 
	documents TEXT,
	createdBy INT NOT NULL REFERENCES users(id),
	createdAt TIMESTAMP NOT NULL DEFAULT NOW()
);

-- CREATE TABLE prescription (
-- 	id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
-- 	apmt_id INT NOT NULL REFERENCES appointment(id),
	
-- )