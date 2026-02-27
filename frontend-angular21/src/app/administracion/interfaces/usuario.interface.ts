export interface UsuarioInterface {

}

export interface UsuarioInterfaceResponse {
    id_usuario: number,
    usu_nom: string,
    ape_mat: string,
    ape_pat: string,
    nombreCompleto: string,
    dni: string,
    email: string,
    celular: number,
    direccion: string,
    genero: string,
    fec_nac: string,
    activo: boolean,
    id_sede: number,
    sedeNombre: string,
    rolNombre?: string,
    rol_nombre?: string,
    rol?: string,
    role?: string,
    roleId?: number
}

export interface UsuarioResponse {
  users: UsuarioInterfaceResponse[];
  total: number;
}

export interface UsuarioRequest {
  usu_nom: string,
  ape_mat: string,
  ape_pat: string,
  nombreCompleto: string,
  dni: string,
  email: string,
  celular: number,
  direccion: string,
  genero: string,
  fec_nac: string,
  activo: boolean,
  id_sede: number,
  sedeNombre: string
}

export interface CuentaUsuarioRequest {
  userId: number,
  username: string,
  password: string,
  roleId: number
}

export interface CuentaUsuarioResponse {
  id: number,
  nombreUsuario: string,
  email: string,
  estado: boolean,
  rolNombre: string
}

export interface UsuarioStatusUpdateRequest {
  activo: boolean;
}

export interface UsuarioUpdateRequest {
  usu_nom: string;
  ape_pat: string;
  ape_mat: string;
  celular: string;
  email: string;
  direccion: string;
  fec_nac: string;
  id_sede: number;
  rolNombre: string;
}