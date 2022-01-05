import { useEffect, useState } from "react";
import Slider from "react-slick";
import NFTCard from "../components/NFTCard";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { Tooltip } from "antd";
import { CheckCircleOutlined } from "@ant-design/icons";

var settings = {
    dots: true,
    infinite: false,
    speed: 500,
    slidesToShow: 4,
    slidesToScroll: 4,
    initialSlide: 0,
    responsive: [
        {
            breakpoint: 1024,
            settings: {
                slidesToShow: 3,
                slidesToScroll: 3,
                infinite: true,
                dots: true
            }
        },
        {
            breakpoint: 600,
            settings: {
                slidesToShow: 2,
                slidesToScroll: 2,
                initialSlide: 2
            }
        },
        {
            breakpoint: 480,
            settings: {
                slidesToShow: 1,
                slidesToScroll: 1
            }
        }
    ]
};

export default function NFTSlider({ nfts, nftSelector }) {

    const selectNFTForSwap = (event, tokenAddress, tokenId) => {
        console.log(">>>>>>>. ", event);
        event.target.style.color = "blue";
        event.target.fill = "blue";
        nftSelector(tokenAddress, tokenId);
    }

    return (
        <div>
            <Slider {...settings}>
                {nfts &&
                    nfts.map((nft, index) => (
                        <div>
                            <NFTCard nft={nft} key={index} actions={[
                                <Tooltip title="Select">
                                    <CheckCircleOutlined onClick={(e) => selectNFTForSwap(e, nft.token_address, nft.token_id)} />
                                </Tooltip>
                            ]} />
                        </div>
                    ))}
            </Slider>
        </div>
    );
}