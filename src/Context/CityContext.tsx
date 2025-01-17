import {
  createContext,
  ReactNode,
  useState,
  useEffect,
  useContext,
  Dispatch,
  SetStateAction,
} from "react";
import { AuthContext } from "./LoginContext";
import { fakeApi, weatherApi } from "../services";
import { ICity } from "../components/AddModal";
import { toast } from "react-toastify";

export interface CityContextData {
  cityApi: ICityResponse;
  loading: boolean;
  tokenExt: string;
  modal: string | null;
  city: ICity[];
  tokenUser: string | null;
  searchFromInput: (data: IData) => Promise<void>;
  setCityApi: React.Dispatch<React.SetStateAction<ICityResponse>>;
  setModal: Dispatch<SetStateAction<string | null>>;
  setCity: Dispatch<SetStateAction<ICity[]>>;
  onSubmitFunction: (data: IUserConfig) => void;
  onSubmitCity: (data: ICity) => void;
  cityInfoFavorite: (name: string) => void;
  deletedCities: (id: string) => void;
}

export interface IData {
  data: string;
  city: string;
}

export interface ICityContext {
  children: ReactNode;
}

export interface ICityResponse {
  location: { name: string; region: string };
  current: {
    temp_c: number;
    condition: {
      icon: string;
    };
    precip_mm: number;
    wind_kph: number;
    wind_dir: number;
  };
  forecast: {
    forecastday: [
      {
        date: string;
        day: {
          maxtemp_c: number;
          mintemp_c: string;
          condition: {
            icon: string;
          };
        };
        astro: {
          sunrise: string;
          sunset: string;
        };
      }
    ];
  };
}

export const CityContext = createContext<CityContextData>(
  {} as CityContextData
);

export interface IUserConfig {
  name?: string;
  city?: string;
  url?: string;
}

const CityProvider = ({ children }: ICityContext) => {
  const [cityApi, setCityApi] = useState<ICityResponse>({} as ICityResponse);
  const [city, setCity] = useState<ICity[]>([]);
  const [modal, setModal] = useState<string | null>(null);
  const { user, setUser, loading, setLoading } = useContext(AuthContext);
  const tokenExt = "27a31f7ad4144e13a70153050221209";

  const tokenUser = localStorage.getItem("@loginBWeather:token");
  const userId = localStorage.getItem("@loginBWeather:user");

  useEffect(() => {
    setLoading(true);

    async function apiWeather() {
      try {
        const { data } = await weatherApi.get(
          `/forecast.json?key=${tokenExt}&q=${user.city} Brazil&days=8`
        );
        setCityApi(data);
      } catch (error) {
        console.error("Esse erro vem da ext", error);
      } finally {
        setTimeout(() => setLoading(false), 3000);
      }
    }
    apiWeather();
  }, [user]);

  const searchFromInput = async (data: IData) => {
    await weatherApi
      .get(
        `/forecast.json?key=${tokenExt}&q=${data.city
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")} Brazil&days=8`
      )
      .then((res) => setCityApi(res.data))
      .catch((err) => console.error("Esse é o problema", err));
  };

  const onSubmitCity = (data: ICity) => {
    data.userId = userId;
    fakeApi
      .post("/city", data)
      .then((response) => {
        toast.success("Cidade adicionada aos seus favoritos", {
          autoClose: 2000,
        });
        setCity((oldCities) => [...oldCities, response.data]);
        setModal(null);
      })
      .catch((error) => console.error("Esse é o problema!", error));
  };

  const onSubmitFunction = (data: IUserConfig) => {
    !data.city && delete data.city;
    !data.name && delete data.name;
    !data.url && delete data.url;

    fakeApi
      .patch(`/users/${userId}`, data, {
        headers: { Authorization: `Bearer ${tokenUser}` },
      })
      .then((res) => {
        toast.success("Perfil editado com sucesso.", { autoClose: 2000 });
        setUser(res.data);
        setModal(null);
      })
      .catch((error) => {
        toast.error("Ocorreu um erro ao editar seu perfil.", {
          autoClose: 2000,
        });
        console.error("Deu esse problema", error);
      });
  };

  useEffect(() => {
    if (tokenUser) {
      fakeApi
        .get("/city", {
          headers: { Authorization: `Bearer ${tokenUser}` },
        })
        .then((res) => {
          setCity(res.data);
          setModal(null);
        })
        .catch((err) => console.error(err));
    }
  }, []);

  useEffect(() => {
    const filteredCity = () => {
      const itensfiltered = city.filter((el) => el.userId === userId);
      setCity(itensfiltered);
    };
    filteredCity();
  }, []);

  const cityInfoFavorite = (name: string) => {
    weatherApi
      .get(
        `/forecast.json?key=${tokenExt}&q=${name
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")} Brazil&days=8`
      )
      .then((res) => setCityApi(res.data))
      .catch((err) => console.error("Esse é o problema", err));
  };

  const deletedCities = (id: string) => {
    fakeApi
      .delete(`/city/${id}`, {
        headers: { Authorization: `Bearer ${tokenUser}` },
      })
      .then(() => {
        const deletedFiltered = city.filter((elem) => elem.id !== id);
        setCity(deletedFiltered);
        toast.success("Cidade removida com sucesso!");
      })
      .catch((err) => console.error("Esse erro vem da Api fake", err));
  };

  return (
    <CityContext.Provider
      value={{
        tokenExt,
        city,
        setCity,
        cityApi,
        loading,
        tokenUser,
        modal,
        searchFromInput,
        setCityApi,
        setModal,
        onSubmitFunction,
        onSubmitCity,
        cityInfoFavorite,
        deletedCities,
      }}
    >
      {children}
    </CityContext.Provider>
  );
};
export default CityProvider;
