from sqlmodel import Session, select

from app.db.session import engine
from app.models import Role, User
from app.core.security import hash_password


EMAIL = "admin@example.com"
PASSWORD = "ChangeThisPassword123!"
FULL_NAME = "Administrator"


def main():
    with Session(engine) as session:
        role = session.exec(
            select(Role).where(Role.name == "superadmin")
        ).first()

        if role is None:
            role = Role(
                name="superadmin",
                permissions="*",
            )
            session.add(role)
            session.flush()

        user = session.exec(
            select(User).where(User.email == EMAIL)
        ).first()

        if user is None:
            user = User(
                email=EMAIL,
                full_name=FULL_NAME,
                password_hash=hash_password(PASSWORD),
                is_active=True,
                is_admin=True,
                role_id=role.id,
            )
            session.add(user)
        else:
            user.full_name = FULL_NAME
            user.password_hash = hash_password(PASSWORD)
            user.is_active = True
            user.is_admin = True
            user.role_id = role.id
            session.add(user)

        session.commit()

        print()
        print("========================================")
        print("ADMIN CREATED / UPDATED")
        print("========================================")
        print(f"Email: {EMAIL}")
        print(f"Password: {PASSWORD}")
        print("Role: superadmin")
        print("is_admin: True")
        print("Permissions: *")
        print("========================================")


if __name__ == "__main__":
    main()
