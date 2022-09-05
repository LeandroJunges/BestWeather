import { useContext, useEffect, useState } from "react";
import { fakeApi } from "../../services";
import { Banner } from "./styles";
import { AuthContext } from "../../Context/LoginContext";
import { CityContext } from "../../Context/CityContext";

interface IBannerResponse {
  email: string;
  password: string;
  name: string;
  url: string;
  occupation: string;
  city: string;
  id: number;
  infos: IInfos[];
}

interface IInfos {
  title: string;
  text1: string;
  text2: string;
  text3: string;
  text4: string;
  text5: string;
  url: string;
  userId: number;
  id: number;
}

const Banners = () => {
  const { userId, user } = useContext(AuthContext);
  const { cityApi } = useContext(CityContext);

  const [banner, setBanner] = useState<IInfos[]>([]);
  const token = localStorage.getItem("@loginBWeather:token") || "";

  useEffect(() => {
    getBanner();
  }, []);

  const getBanner = () => {
    fakeApi
      .get<IBannerResponse>(`/users/${userId}?_embed=infos`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      .then((response) => setBanner(response.data.infos))
      .catch((err) => console.error("Esse é o problema", err));
  };

  const getMessageTemp = (elem: IInfos) => {
    const temp = cityApi.current.temp_c;

    return temp < 20 ? (
      <p>{elem.text1}</p>
    ) : temp < 30 ? (
      <p>{elem.text2}</p>
    ) : temp < 35 ? (
      <p>{elem.text3}</p>
    ) : (
      <p>{elem.text4}</p>
    );
  };

  const getMessagePrec = (elem: IInfos) => {
    const prec = cityApi.current.precip_mm;

    return prec === 0 ? <p>{elem?.text1}</p> : <p>{elem?.text2}</p>;
  };

  const getMessageWind = (elem: IInfos) => {
    const wind = cityApi.current.wind_kph;

    return wind < 9 ? (
      <p>{elem.text1}</p>
    ) : wind < 19 ? (
      <p>{elem.text2}</p>
    ) : (
      <p>{elem.text3}</p>
    );
  };

  const checkOccupation = () => {
    if (user.occupation === "Paraquedista" || user.occupation === "Asa Delta") {
      return getMessagePrec(banner[0]);
    } else if (user.occupation === "Surfista") {
      return getMessageWind(banner[0]);
    } else {
      return getMessageTemp(banner[0]);
    }
  };

  const showTextOccupation = banner[0] && checkOccupation();

  return (
    <Banner>
      <div className="divText" key={banner[0]?.id}>
        <>
          <h3>{banner[0]?.title}</h3>
          <p>{user.name}</p>
          {showTextOccupation}
        </>
      </div>
      <img src={banner[0]?.url} alt="Occupation" />
    </Banner>
  );
};

export default Banners;