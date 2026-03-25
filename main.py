import uvicorn
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
from sqlalchemy import create_engine, Column, Integer, String
from sqlalchemy.orm import declarative_base, sessionmaker, Session
import json

# 1. CONFIGURACIÓN DE LA BASE DE DATOS (SQLite + SQLAlchemy)
SQLALCHEMY_DATABASE_URL = "sqlite:///./reservaciones.db"
# check_same_thread=False es necesario en SQLite para FastAPI
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


# 2. MODELO DE BASE DE DATOS (Cómo se guarda en el archivo .db)
class ReservaDB(Base):
    __tablename__ = "reservaciones"

    id = Column(Integer, primary_key=True, index=True)
    solicitante = Column(String, index=True)
    evento = Column(String)
    fecha = Column(String)
    hora_inicio = Column(String)
    hora_fin = Column(String)
    asistentes = Column(Integer)
    acomodo = Column(String)
    # Guardaremos las listas (salas y requerimientos) como texto JSON
    salas = Column(String)
    requerimientos = Column(String)


# Crea la base de datos y las tablas si no existen
Base.metadata.create_all(bind=engine)


# 3. MODELO DE PYDANTIC (Cómo recibe los datos desde tu JavaScript)
class ReservacionInput(BaseModel):
    solicitante: str
    evento: str
    fecha: str
    hora_inicio: str
    hora_fin: str
    asistentes: int
    acomodo: str
    salas: List[int]
    requerimientos: List[str]


# Inicializamos la aplicación
app = FastAPI(title="API Gestión de Salas Unison")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Dependencia para conectarse a la base de datos en cada petición
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# 4. ENDPOINTS (Rutas)
@app.post("/api/reservaciones")
def guardar_reservacion(reserva: ReservacionInput, db: Session = Depends(get_db)):
    # Convertimos las listas a strings JSON para poder guardarlas en SQLite
    nueva_reserva = ReservaDB(
        solicitante=reserva.solicitante,
        evento=reserva.evento,
        fecha=reserva.fecha,
        hora_inicio=reserva.hora_inicio,
        hora_fin=reserva.hora_fin,
        asistentes=reserva.asistentes,
        acomodo=reserva.acomodo,
        salas=json.dumps(reserva.salas),
        requerimientos=json.dumps(reserva.requerimientos)
    )

    db.add(nueva_reserva)
    db.commit()
    db.refresh(nueva_reserva)  # Para obtener el ID generado

    return {"estatus": "exito", "mensaje": "Reservación guardada en DB", "id": nueva_reserva.id}


@app.get("/api/reservaciones")
def ver_reservaciones(db: Session = Depends(get_db)):
    reservas = db.query(ReservaDB).all()
    # Volvemos a convertir el texto JSON a listas para mandarlo al Frontend
    resultado = []
    for r in reservas:
        resultado.append({
            "id": r.id,
            "solicitante": r.solicitante,
            "evento": r.evento,
            "fecha": r.fecha,
            "hora_inicio": r.hora_inicio,
            "hora_fin": r.hora_fin,
            "asistentes": r.asistentes,
            "acomodo": r.acomodo,
            "salas": json.loads(r.salas),
            "requerimientos": json.loads(r.requerimientos)
        })
    return resultado

if __name__ == "__main__":
    print("Iniciando servidor de Salas Unison...")
    # 'main:app' significa: en el archivo main.py, busca la variable 'app'
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)