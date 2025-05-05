import Link from 'next/link';
import React, { useState } from 'react';
import { FaUser, FaChevronDown, FaSignOutAlt } from 'react-icons/fa';

const Navbar = () => {
  return (
    <>
      <div className="flex justify-between ">
        <div className="bg-white w-full flex justify-between sm:px-7 sm:py-8 items-center">
          <div className="text-black  ">
            <p className="text-4xl font-semibold">Dashboard</p>
          </div>
        </div>
        <div className="flex justify-center items-center mr-16">
          <div className="inline-flex gap-2 items-center cursor-pointer">
            <div className="whitespace-nowrap text-base font-medium text-black">
              Husnain Chand
              <p className="text-base text-black font-normal">
                hsunain.C@email.com
              </p>
            </div>
          </div>
          <div>
            <button className="focus:outline-none">
              <FaChevronDown className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Navbar;
