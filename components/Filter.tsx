import { Menu, Transition } from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/solid";
import { Fragment } from "react";

interface Props {
  list: string[];
  activeItem: string;
  category: string;
  onChange: (item: string) => void;
}

export const Filter: React.FC<Props> = ({
  list,
  activeItem,
  category,
  onChange,
}) => {
  return (
    <Menu as="div" className="relative inline-block text-left">
      <div>
        <Menu.Button className="group inline-flex items-center justify-center px-4 py-2.5 text-sm font-medium text-dark-600 glass-card rounded-xl hover:border-kris-500/30 transition-all duration-200">
          <span className="text-dark-500 mr-1.5">{category}:</span>
          <span className="text-white">{activeItem}</span>
          <ChevronDownIcon
            className="w-4 h-4 ml-2 text-dark-500 group-hover:text-kris-400 transition-colors duration-200"
            aria-hidden="true"
          />
        </Menu.Button>
      </div>
      <Transition
        as={Fragment}
        enter="transition ease-out duration-200"
        enterFrom="transform opacity-0 scale-95 -translate-y-2"
        enterTo="transform opacity-100 scale-100 translate-y-0"
        leave="transition ease-in duration-150"
        leaveFrom="transform opacity-100 scale-100 translate-y-0"
        leaveTo="transform opacity-0 scale-95 -translate-y-2"
      >
        <Menu.Items className="z-50 absolute left-0 w-56 mt-2 origin-top-left glass-card rounded-xl shadow-glass overflow-hidden focus:outline-none">
          <div className="p-2">
            {list.map((item) => (
              <Menu.Item key={item}>
                {({ active }) => (
                  <button
                    onClick={() => onChange(item)}
                    className={`
                      w-full flex items-center px-3 py-2.5 text-sm rounded-lg transition-all duration-150
                      ${
                        activeItem === item
                          ? "bg-kris-500/20 text-kris-300 border border-kris-500/30"
                          : active
                          ? "bg-white/5 text-white"
                          : "text-dark-600 hover:text-white"
                      }
                    `}
                  >
                    {activeItem === item && (
                      <svg
                        className="w-4 h-4 mr-2 text-kris-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                    <span className={activeItem !== item ? "ml-6" : ""}>
                      {item}
                    </span>
                  </button>
                )}
              </Menu.Item>
            ))}
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
};
