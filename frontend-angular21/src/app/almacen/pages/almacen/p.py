import bcrypt

def generar(password: str) -> str:
    # Genera un hash bcrypt para la contraseña dada
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')


if __name__ == "__main__":
    password = "admin123"
    hashed_password = generar(password)
    print(f"Hashed password: {hashed_password}")